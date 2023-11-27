from ninja import NinjaAPI, File
from ninja.files import UploadedFile
from jsonrpc_requests import Server
from .schema import (LoginInfo, Token, XDR, DisputeHistoryOUT, EditResult)
from .models import DisputeHistory
from .utils import get_local_xdr, compute_xdr
import json
from typing import List
import jwt, io
from django.shortcuts import get_object_or_404
import pandas as pd
from django.core.files.base import ContentFile
from django.http import HttpResponse, FileResponse
import os

api = NinjaAPI()

SERVER_ADDRESS = os.environ['DISPUTE_COREAPI_SERVER']
STORAGE_PATH = os.environ['DISPUTE_FILE_STORAGE']
XDR_COL_NAME = [element.strip() for element in os.environ.get('XDR_COL_NAME', '').split(",")]
def get_coreapi( token):
    coreapi = Server(SERVER_ADDRESS, headers={'Authorization': f'Bearer {token}'})
    try:
        coreapi.clients.search(limit=1)
        return coreapi
    except:
        return False
@api.post("/get_token", auth=None)
def get_token(request, data:LoginInfo):
    coreapi_unauthorized = Server(SERVER_ADDRESS)
    try:
        result = coreapi_unauthorized.iam.auth.jwt.authenticate(
            login=data.username,
            password=data.password
        )
        print(data)
        coreapi = get_coreapi( result['token'])
        role = coreapi.iam.users.search(login=data.username)[0]['roles_name']
        if role not in ['Administrator', 'xDR Checker']:
            return api.create_response(
                request,
                {"error_detail": "You do not have permission to process"},
                status=401,
            )
        return result['token']
    except Exception:
        return api.create_response(
            request,
            {"error_detail": "Authenticate failed"},
            status=512,
        )

@api.post("/list_client")
def list_client(request, data: Token):
    try:
        coreapi = get_coreapi( data.token)
        if not coreapi:
            return api.create_response(
                request,
                {"error_detail": "Invalid access token. Please relogin!"},
                status=498,
            )
        clients = coreapi.clients.search()
        return [{'id': client['id'], 'name':client['name'], 'status':client['status']} for client in clients]
    except Exception:
        return api.create_response(
            request,
            {"error_detail": None},
            status=512,
        )

@api.post("/list_account")
def list_account(request, data: Token):
    try:
        coreapi = get_coreapi( data.token)
        if not coreapi:
            return api.create_response(
                request,
                {"error_detail": "Invalid access token. Please relogin!"},
                status=498,
            )
        accounts = coreapi.clients.accounts.search()
        return [{'id': account['id'], 'name':account['name'],
                 'clients_id': account['clients_id'], 'clients_name':account['clients_name']} for account in accounts]
    except Exception:
        return api.create_response(
            request,
            {"error_detail": None},
            status=512,
        )

def check_permission( token, coreapi):
    try:
        uid = jwt.decode(token, options={"verify_signature": False})['uid']
        role = coreapi.iam.users.get(id=uid)['roles_name']
        return role in ['Administrator', 'xDR Checker'], uid, False
    except:
        return False, False, True
@api.post("/dispute_xdr")
def xdr_dispute(request, data: XDR, xdr_file: UploadedFile = File(...)):
    try:
        coreapi = get_coreapi( data.token)
        if not coreapi:
            return api.create_response(
                request,
                {"error_detail": "Invalid access token. Please relogin!"},
                status=498,
            )
        
        permission_check, uid, error = check_permission(data.token, coreapi)
        if error or (not permission_check):
            return api.create_response(
                request,
                {"error_detail": "Invalid authority or access token!"},
                status=401,
            )

        if data.filter["billed_accounts_id"]:
            account = coreapi.clients.accounts.search(id=data.filter["billed_accounts_id"])[0]
            client_account = f"{account['clients_name']} / {account['name']}"
        else:
            client = coreapi.clients.get(id=data.filter["billed_clients_id"])
            client_account = f"{client['name']} / all accounts"


        if len(data.required_field.keys()) != 5:
            return api.create_response(
                request,
                {"error_detail": "Invalid required field"},
                status=512,
            )
        else:
            kv = sorted(data.required_field.items())
            use_cols_index = []
            use_cols_name = []
            for k, v in kv:
                use_cols_index.append(int(k.split('_')[-1]))
                use_cols_name.append(v)
            if set(use_cols_name) != set(XDR_COL_NAME):
                return api.create_response(
                    request,
                    {"error_detail": "Invalid required field"},
                    status=512,
                )
        
        l_xdr = get_local_xdr(coreapi, data.filter, data.optional_filter)
        print(f"l_xdr::::: {l_xdr}")
        e_xdr = pd.read_csv(io.StringIO(xdr_file.read().decode('utf-8')),
                            delimiter=',', header=None, usecols=use_cols_index, names=use_cols_name)
        ext_content = ContentFile(e_xdr.to_csv(index=False).encode('utf-8'))
        dispute_result, len_redl, len_rede, rows_removed  = compute_xdr(l_xdr, e_xdr, data.option)
        result_content = ContentFile(dispute_result.to_csv(index=False).encode('utf-8'))
        
        total_qty_b = 0
        if rows_removed == 1:
            total_qty_b = (len(l_xdr) + len(e_xdr) - rows_removed)
        else:
            total_qty_b = (len(l_xdr) + len(e_xdr) )
        # print(f"{len(l_xdr)=} || {len(e_xdr)=} || {rows_removed=}")
        try:
            print(f"{data.filter}")
            dispute_record = DisputeHistory.objects.create(**{
                "uid": uid,
                "client_account": client_account,
                "client_id": data.filter["billed_clients_id"] if "billed_clients_id" in data.filter else None,
                "account_id": data.filter["billed_accounts_id"] if "billed_accounts_id" in data.filter else None,
                "origin": data.filter["origin"],
                "start_time": data.filter["date"][0],
                "stop_time": data.filter["date"][1],
                "no_l": len_redl,
                "no_e": len_rede,
                "total": total_qty_b,
                "src_number": data.option["src_number"],
                "dst_number": data.option["dst_number"],
                "number_of_result": len(dispute_result.index),
                "subscriber_host": data.optional_filter['subscriber_host'],
                "subscriber_id": data.optional_filter["subscriber_id"],
                "connect_time_offset": data.option["connect_time_offset"],
                "volume_offset": data.option["volume_offset"]
            })
            print("check ----------------midd--------------")
            dispute_record.ext_cdr_file.save(f'{STORAGE_PATH}/{dispute_record.id}_ext_cdr_file.csv', ext_content)
            dispute_record.dispute_result.save(f'{STORAGE_PATH}/{dispute_record.id}_dispute_result.csv', result_content)
            print("check22222")
            return dispute_record.id
        except Exception as e:
            # Xử lý lỗi tại đây
            print(f"Error: {e}")
            # Có thể thêm các biện pháp phục hồi hoặc thông báo lỗi cho người dùng ở đây
            # Nếu bạn muốn ngừng thực hiện và không tiếp tục thực hiện mã, bạn có thể sử dụng `return` hoặc raise
            return None  # hoặc raise Exception("Error occurred")

       
    except Exception as e:
        return api.create_response(
            request,
            {"error_detail": e},
            status=512,
        )


@api.post("/edit_xdr_result/")
def edit_result(request, data: EditResult, id: int):

    coreapi = get_coreapi( data.token)
    if not coreapi:
        return api.create_response(
            request,
            {"error_detail": "Invalid access token. Please relogin!"},
            status=498,
        )
    permission_check, uid, error = check_permission(data.token, coreapi)
    if error or (not permission_check):
        return api.create_response(
            request,
            {"error_detail": "Invalid authority or access token!"},
            status=401,
        )
    dispute_record = get_object_or_404(DisputeHistory, id=id, uid=uid)
    e_xdr = pd.read_csv(dispute_record.ext_cdr_file.path)
    filter = {
        "date":[
            dispute_record.start_time,
            dispute_record.stop_time
        ],
        "origin": dispute_record.origin,
        "billed_clients_id": dispute_record.client_id
    }
    if dispute_record.account_id:
        filter["billed_accounts_id"]=dispute_record.account_id
    optional_filter = {
        "subscriber_host": dispute_record.subscriber_host,
        "subscriber_id": dispute_record.subscriber_id
    }
    l_xdr = get_local_xdr(coreapi, filter, optional_filter)
    dispute_result, len_redl, len_rede, rows_removed   = compute_xdr(l_xdr, e_xdr, data.option)

    total_qty_b = 0
    if rows_removed == 1:
        total_qty_b = (len(l_xdr) + len(e_xdr) - rows_removed)
    else:
        total_qty_b = (len(l_xdr) + len(e_xdr) )

    dispute_record.src_number = data.option["src_number"]
    dispute_record.dst_number = data.option["dst_number"]
    dispute_record.connect_time_offset = data.option["connect_time_offset"]
    dispute_record.volume_offset = data.option["volume_offset"]
    # dispute_record.no_l=len(l_xdr)
    dispute_record.no_l=len_redl
    dispute_record.no_e=len_rede
    dispute_record.total = total_qty_b
    # dispute_record.total=dispute_record.no_e+len(l_xdr)
    result_content = ContentFile(dispute_result.to_csv(index=False).encode('utf-8'))
    dispute_record.dispute_result.save(f'{STORAGE_PATH}/{dispute_record.id}_dispute_result.csv', result_content)
    return dispute_record.id


@api.post("/show_xdr_result/")
def show_result(request, data: Token, id: int, page: int = 1, num_per_page: int = 50):
    coreapi = get_coreapi( data.token)
    if not coreapi:
        return api.create_response(
            request,
            {"error_detail": "Invalid access token. Please relogin!"},
            status=498,
        )
    permission_check, uid, error = check_permission(data.token, coreapi)
    if error or (not permission_check):
        return api.create_response(
            request,
            {"error_detail": "Invalid authority or access token!"},
            status=401,
        )

    dispute_record = get_object_or_404(DisputeHistory, id=id, uid=uid)
    dispute_result=pd.read_csv(dispute_record.dispute_result.path,skiprows=range(1, (page - 1) * num_per_page+1),nrows=num_per_page)
    return {
        'option': {
            'src_number': dispute_record.src_number,
            'dst_number': dispute_record.dst_number,
            'connect_time_offset': dispute_record.connect_time_offset,
            'volume_offset': dispute_record.volume_offset
            },
        'result': json.loads(dispute_result.to_json(orient='records')),
        'total': dispute_record.number_of_result
    }



@api.post("/refresh_token/")
def refresh_token(request, data: Token):
    coreapi = get_coreapi( data.token)
    if not coreapi:
        return api.create_response(
            request,
            {"error_detail": "Invalid access token. Please relogin!"},
            status=498,
        )
    
    return {"token": coreapi.iam.auth.jwt.refresh()['token']}



@api.post("/dispute_history",response=List[DisputeHistoryOUT])
def dispute_history(request, data: Token):
    coreapi = get_coreapi(data.token)
    if not coreapi:
        return api.create_response(
            request,
            {"error_detail": "Invalid access token. Please relogin!"},
            status=498,
        )

    permission_check, uid, error = check_permission(data.token, coreapi)
    if error or (not permission_check):
        return api.create_response(
            request,
            {"error_detail": "Invalid authority or access token!"},
            status=401,
        )
    return DisputeHistory.objects.filter(uid=uid)


@api.delete("/remove_dispute/{id}")
def delete_dispute(request, id: int, data:Token):
    coreapi = get_coreapi(data.token)
    if not coreapi:
        return api.create_response(
            request,
            {"error_detail": "Invalid access token. Please relogin!"},
            status=498,
        )

    permission_check, uid, error = check_permission(data.token, coreapi)
    if error or (not permission_check):
        return api.create_response(
            request,
            {"error_detail": "Invalid authority or access token!"},
            status=401,
        )
    dispute = get_object_or_404(DisputeHistory, id=id)
    dispute.delete()
    return {"success": True}

@api.post("/download_result/{id}")
def download_dispute(request, id: int, data:Token):
    coreapi = get_coreapi( data.token)
    if not coreapi:
        return api.create_response(
            request,
            {"error_detail": "Invalid access token. Please relogin!"},
            status=498,
        )
    permission_check, uid, error = check_permission(data.token, coreapi)
    if error or (not permission_check):
        return api.create_response(
            request,
            {"error_detail": "Invalid authority or access token!"},
            status=401,
        )
    dispute_record = get_object_or_404(DisputeHistory, id=id, uid=uid)
    dispute_result = pd.read_csv(dispute_record.dispute_result.path)
    dispute_result.rename(columns={'src_party_id_ext_local': 'SRC Party ID (L)',
                       'src_party_id_ext_ext': 'SRC Party ID (E)',
                       'dst_party_id_ext_local': 'DST Party ID (L)',
                       'dst_party_id_ext_ext': 'DST Party ID (E)',
                       'start_time_local': 'Connect Time (L)',
                       'start_time_ext': 'Connect Time (E)',
                       'stop_time_local': 'Finish Time (L)',
                       'stop_time_ext': 'Finish Time (E)',
                       'volume_local': 'Volume (L)',
                       'volume_ext': 'Volume (E)'}, inplace=True)
    dispute_result['result'] = dispute_result['result'].apply(
        lambda x: 'Not matched' if x in ('L', 'E') else ('Exactly matched' if x == 'G' else 'Matched with offsets'))
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="data.csv"'
    dispute_result.to_csv(response, index=False)
    return FileResponse(response, as_attachment=True)




# if __name__ == "__main__":