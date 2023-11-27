# XDR DISPUTE DJANGO BACKEND

## Step to run

In the project directory, you run:
### `pip install -r requirements.txt`
Install the project's requirements

### `python manage.py makemigrations`
Make project's magiration

### `python manage.py migrate`
Execute magiration

### `python manage.py runserver`
Run the server

Access [http://localhost:8000/api/docs](http://localhost:8000/api/docs)
to view API docs

curl -X 'POST' \
  'http://xdr-dispute-be.istt.com.vn/api/get_token' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "username": "guest",
  "password": "guest123"
}'