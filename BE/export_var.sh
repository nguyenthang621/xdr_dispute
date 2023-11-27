#!/bin/bash

# Define the environment variable
export DISPUTE_COREAPI_SERVER="http://192.168.10.9:3080"
export DISPUTE_FILE_STORAGE=FILE_STORAGE
export DISPUTE_SECRET_KEY=vHK3sD0zd39F1SN1BIkR
export XDR_COL_NAME="src_party_id_ext , dst_party_id_ext,start_time,stop_time,volume"
export XDR_ADDITION_COL="subscriber_host,subscriber_id"
export DISPUTE_DB_NAME=xdr_dispute
export DISPUTE_DB_USER=dispute
export DISPUTE_DB_PASSWORD=dispute
export DISPUTE_DB_HOST=10.0.40.132
export DISPUTE_DB_PORT=3306


curl --location 'https://localhost:8011' \
--header 'Content-Type: text/plain' \
--data '{
  "username": "dispute_admin",
  "password": "9UNAB6NSnr+kAgkV"
}'

curl 'https://192.168.10.9/xdr-dispute-be/api/dispute_xdr' \
  --data-raw $'------WebKitFormBoundaryJhBivdui0O2RJcan\r\nContent-Disposition: form-data; name="xdr_file"; filename="sample_xdr.csv"\r\nContent-Type: text/csv\r\n\r\n\r\n------WebKitFormBoundaryJhBivdui0O2RJcan\r\nContent-Disposition: form-data; name="data"\r\n\r\n{"token":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOjE5LCJhdWQiOlsidWlwOjE5Mi4xNjguMTAuOSJdLCJleHAiOjE2OTQ2NjYyNTN9.1r4hOJZHMk9F1lgmQA-rsC0Znby934LlGvF645CD0qc","filter":{"origin":"orig","billed_clients_id":36,"billed_accounts_id":null,"date":["2023-08-01 11:33:53","2023-09-10 11:33:56"],"rates_dst_code_name":null,"rates_dst_code":null},"optional_filter":{"subscriber_host":null,"subscriber_id":null},"option":{"src_number":null,"dst_number":null,"connect_time_offset":0,"volume_offset":0},"required_field":{"select_col_0":"src_party_id_ext","select_col_1":"dst_party_id_ext","select_col_4":"start_time","select_col_5":"stop_time","select_col_6":"volume"}}\r\n------WebKitFormBoundaryJhBivdui0O2RJcan--\r\n' \
  --compressed \
  --insecure


curl --location 'http://127.0.0.1:3080' \
--header 'Content-Type: application/json' \
--data '{
  "jsonrpc": "2.0",
  "method": "iam.auth.jwt.authenticate",
  "params": {
    "login": "servicecontrol",
    "password": "Vcs@2023"
  },
  "id": 1
}'