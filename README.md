To use deploy this app locally, there are some requirements you need to install
git clone https://github.com/HuKaiLiLaJi/FIT5120main.git
pip install flask
pip install flask_sqlalchemy
pip install SQLAlchemy
pip install pymysql
pip install openai
pip install requests

if there are bugs on sql connection, you may change a sql connect engine

There are 2 api services in our project
deepseek and sightengine
deepseek is for general chatting or summary
sightengine is for ai detect
if you need to deploy this project locally, buying those apis is necessary.

It's good to access this project on https://safe-stream.cc/
but sometimes it could be blocked by some instutions
then try the replacement http://34.235.100.38:8080/

location of code, extesion, remote

cd FIT5120main, cd app, cd pyfiles