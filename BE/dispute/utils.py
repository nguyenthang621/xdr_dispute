import datetime
from pandasql import sqldf
import pandas as pd
import os

XDR_COL_NAME = [element.strip() for element in os.environ.get('XDR_COL_NAME', '').split(",")]
XDR_ADDITION_COL = [element.strip() for element in os.environ.get('XDR_ADDITION_COL', '').split(",")]
def get_local_xdr(coreapi, filter, optional_filter) -> pd.DataFrame:   # Lấy ra data từ jerasoft 
    no_null_filter={}
    for x in filter:
        if filter[x] is not None:
            no_null_filter[x]=filter[x]
    print(f"{no_null_filter=}")
    list_xdr = coreapi.reports.xdrs_list.query(return_fields=XDR_COL_NAME + XDR_ADDITION_COL ,
                                          filters=no_null_filter,  limit = 1000000000)
    
    if list_xdr:
        l_xdr = pd.DataFrame.from_dict(list_xdr)
        mask = pd.Series(True, index=l_xdr.index)
        for column, value in optional_filter.items():
            if value is not None and value != "":
                mask = mask & (l_xdr[column] == value)
        mask = mask & (l_xdr["volume"] > 0)
        return l_xdr.loc[mask, XDR_COL_NAME]
    else:
        l_xdr = pd.DataFrame(columns = XDR_COL_NAME)
        return l_xdr

def convert_to_unix(timestamp_str):
    try:
        return datetime.datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S %z').timestamp()
    except ValueError:
        try:
            return datetime.datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S%z').timestamp()
        except ValueError:
            return None

# function convert time to timestamp:
def add_unix(df: pd.DataFrame):  
    df['start_unix'] = df['start_time'].apply(convert_to_unix)  

# def add_unix(df: pd.DataFrame):  
#     df['start_unix'] = df['start_time'].apply(lambda x: datetime.datetime.
#                                                     strptime(x, '%Y-%m-%d %H:%M:%S%z').timestamp()) 
    
# function điều chỉnh offset vào cột của dataframe l_xdr và e_xdr 
def apply_offset(l_xdr, e_xdr, option):
    compare_cols = []
    if option['src_number']:
        tmp = option['src_number']
        l_xdr['compare_src'] = l_xdr['src_party_id_ext'].apply(lambda x: str(x)[-tmp:])
        e_xdr['compare_src'] = e_xdr['src_party_id_ext'].apply(lambda x: str(x)[-tmp:])
        compare_cols.append('compare_src')
    else:
        compare_cols.append('src_party_id_ext')

    if option['dst_number']:
        tmp = option['dst_number']
        l_xdr['compare_dst'] = l_xdr['dst_party_id_ext'].apply(lambda x: str(x)[-tmp:])
        e_xdr['compare_dst'] = e_xdr['dst_party_id_ext'].apply(lambda x: str(x)[-tmp:])
        compare_cols.append('compare_dst')
    else:
        compare_cols.append('dst_party_id_ext')

    if option["connect_time_offset"]:
        compare_cols.append(True)
    else:
        compare_cols.append(False)

    if option["volume_offset"]:
        compare_cols.append(True)
    else:
        compare_cols.append(False)
    return compare_cols


def compute_xdr(l_xdr, e_xdr, option):
    # option : config sai số
    return_col = ['result']
    for x in l_xdr.columns:  # lấy ra tên cột so sánh
        return_col += [f"{x}_local", f"{x}_ext"]
    l_xdr['index'] = l_xdr.index
    #bỏ các row có giá trị N/A
    e_xdr.dropna(inplace=True)
    e_xdr['index'] = e_xdr.index
    #handle loại bỏ dòng đầu title(nếu có)
    total_rows_before = e_xdr.shape[0]
    e_xdr=e_xdr[~e_xdr.apply(lambda row: any(keyword in row.values for keyword in ["Src Party ID", "Dst Party ID", "Volume"]), axis=1)]
    total_rows_after = e_xdr.shape[0]
    rows_removed = total_rows_before - total_rows_after

    cmp_cols = l_xdr.columns
    select = ", ".join([f"loc.`{x}` {x}_local, ext.`{x}` {x}_ext" for x in cmp_cols])
    add_unix(l_xdr)
    add_unix(e_xdr)
    # e_xdr['volume_upper_bound'] = e_xdr['volume'].apply(lambda x: x + 10)
    # e_xdr['volume_lower_bound'] = e_xdr['volume'].apply(lambda x: x - 10)

    # data giống nhau tuyệt đối(green) (join 2 bảng)
    green_query = f"""SELECT {select}, 'G' result
                FROM l_xdr loc
                JOIN e_xdr ext
                ON loc.src_party_id_ext = ext.src_party_id_ext
                AND loc.dst_party_id_ext = ext.dst_party_id_ext
                AND CAST(loc.volume AS INTEGER) = CAST(ext.volume AS INTEGER)
                AND loc.start_unix = ext.start_unix
                """
    green = sqldf(green_query)

    # l_left và e_left lad dataframe chứa các hàng trong l_xdr và e_xdr mà không có sự khớp nào trong green
    l_left = sqldf("""
                SELECT *
                FROM l_xdr
                where `index` not in (select index_local from green)
                """)

    e_left = sqldf("""
                SELECT *
                FROM e_xdr
                where `index` not in (select index_ext from green)
                """)

    # So sánh và lấy ra các record trong sai số cho phép (yellow)
    if option["src_number"] or option["src_number"] or option["connect_time_offset"] or option["volume_offset"]:
        compare_cols = apply_offset(l_left, e_left, option)  # Lấy ra cột cần so sánh 
        yellow_query = f""" SELECT {select}, 'Y' result
                FROM l_left loc
                JOIN e_left ext
                ON loc.{compare_cols[0]} = ext.{compare_cols[0]}
                AND loc.{compare_cols[1]} = ext.{compare_cols[1]}
                """
        if compare_cols[2]:
            yellow_query += f"""
                AND loc.start_unix >= ext.start_unix - {option['connect_time_offset']}
                AND loc.start_unix <= ext.start_unix + {option['connect_time_offset']}"""
        else:
            yellow_query += f""" AND loc.start_unix = ext.start_unix"""
        if compare_cols[3]:
            yellow_query += f"""
                AND loc.volume >= ext.volume - {option['volume_offset']}
                AND loc.volume <= ext.volume + {option['volume_offset']}"""
        else:
            yellow_query += f""" AND loc.volume = ext.volume"""
        yellow = sqldf(yellow_query) 
    else:
        yellow = pd.DataFrame(columns=green.columns)


    # Lấy ra phần còn lại (red: ko trùng lặp trong sai số cho phép) 
    red_query_L = f"""
            SELECT {", ".join([f"`{x}` {x}_local, null {x}_ext" for x in cmp_cols])},
                    start_unix start_unix_local,
                    start_unix start_unix_ext,
                    'L' result
            FROM l_left
            where index_local not in (select index_local from yellow)
            """
    red_query_E = f"""
                SELECT {", ".join([f"null {x}_local, `{x}` {x}_ext" for x in cmp_cols])},
                        start_unix start_unix_local,
                        start_unix start_unix_ext,
                        'E' result
                FROM e_left
                where index_ext not in (select index_ext from yellow)
                """

    redl = sqldf(red_query_L)
    rede = sqldf(red_query_E)
    agg = pd.concat([green, yellow, redl, rede], axis=0).sort_values('start_unix_local')
    print(f"{len(redl)=} || {len(redl)=} || {rows_removed=}")
    return agg[return_col], len(redl), len(rede), rows_removed



if __name__ == '__main__':
     print("Test utils:" + get_local_xdr())