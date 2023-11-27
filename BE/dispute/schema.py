from ninja import Schema
from typing import Optional



class LoginInfo(Schema):
    username: str
    password : str

class Token(Schema):
    token: str
class EditResult(Schema):
    token: str
    option: dict

class XDR(Schema):
    token: str
    filter: dict
    optional_filter: dict
    option: dict
    required_field: dict


class DisputeHistoryOUT(Schema):
    id : int
    client_account : str
    client_id :  Optional[int] = None
    account_id : Optional[int] = None
    start_time : str
    stop_time : str
    total : int
    no_l : int
    no_e : int
    src_number : Optional[int] = None
    dst_number : Optional[int] = None
    connect_time_offset : int
    volume_offset : int
    subscriber_host: str = None
    subscriber_id: str = None