from flask import Flask, render_template, request, jsonify
from datetime import datetime, timedelta
from models import db, Event
import calendar
from openai import OpenAI

app = Flask(__name__,template_folder='../templates',static_folder='../static')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///calendar.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
client = OpenAI(api_key="", base_url="https://api.deepseek.com")

@app.before_request
def create_tables():
    db.create_all()

def get_week_dates(base_date=None):
    if base_date is None:
        base_date = datetime.today()
    start = base_date - timedelta(days=base_date.weekday())
    return [(start + timedelta(days=i)).date() for i in range(7)]

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/epic1')
def epic1():
    return '<h2>This is Epic 1 page</h2>'
@app.route('/epic2')
def epic2():
    week_dates = get_week_dates()
    events = Event.query.filter(Event.date.in_(week_dates)).all()
    events_by_day = {d: [] for d in week_dates}
    for event in events:
        events_by_day[event.date].append(event)
    return render_template('calendar.html', week_dates=week_dates, events_by_day=events_by_day)

@app.route('/add', methods=['POST'])
def add_event():
    data = request.get_json()
    event = Event(
        date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
        title=data['title'],
        description=data.get('description', ''),
        start_time=datetime.strptime(data['start_time'], '%H:%M').time(),
        end_time=datetime.strptime(data['end_time'], '%H:%M').time()
    )
    db.session.add(event)
    db.session.commit()
    return jsonify({'status': 'success'})


@app.route('/recommendation',methods=['POST'])
def get_recommendation():
    data=request.get_json()
    input_text=data.get('input')
    response=client.chat.completions.create(
        model='deepseek-chat',
        messages=[
            {"role": "system", "content": "You are a helpful assistant"},
            {"role": "user", "content": '讲讲'+input_text},
        ],
        stream=False
    )
    result=response.choices[0].message.content
    return jsonify({'message': result})
    
    

if __name__ == '__main__':
    app.run(debug=True)
