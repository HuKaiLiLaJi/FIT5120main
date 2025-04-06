from flask import Flask, render_template, request, jsonify
from datetime import datetime, timedelta
from models import db, Event
import calendar
from openai import OpenAI
import json

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
    return render_template('epic1.html')
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
    
@app.route('/epic2/events-by-day')
def get_events_by_day():
    day_name = request.args.get('day')  
    if not day_name:
        return jsonify([])
    
    
    week_dates = get_week_dates()
    
    target_date = next((d for d in week_dates if d.strftime('%A') == day_name), None)
    
    if not target_date:
        return jsonify([])
    events = Event.query.filter_by(date=target_date).order_by(Event.start_time).all()
    events_json = [{
        'title': event.title,
        'description': event.description,
        'start_time': event.start_time.strftime('%H:%M'),
        'end_time': event.end_time.strftime('%H:%M'),
        'date': event.date.strftime('%Y-%m-%d')
    } for event in events]
    
    return jsonify(events_json)
    

@app.route('/analyze-with-deepseek', methods=['POST'])
def analyze_with_deepseek():
    data = request.get_json()
    day = data.get('day')  
    
    
    week_dates = get_week_dates()
    target_date = next((d for d in week_dates if d.strftime('%A') == day), None)
    
    if not target_date:
        return jsonify({'message': 'event data not found'})
    
    events = Event.query.filter_by(date=target_date).all()
    events_data = [{
        'title': e.title,
        'time': f"{e.start_time.strftime('%H:%M')}-{e.end_time.strftime('%H:%M')}",
        'description': e.description
    } for e in events]
    
    
    response = client.chat.completions.create(
        model='deepseek-chat',
        messages=[
            {
                "role": "system", 
                "content": "你是一个健康生活助手，请分析用户的事件安排并给出健康建议"
            },
            {
                "role": "user", 
                "content": f"""请分析以下{day}的事件安排是否合理：
                {json.dumps(events_data, indent=2, ensure_ascii=False)}
                
                要求：
                1. 健康评分（1-5分）
                2. 主要问题
                3. 改进建议
                请用英语回答"""
            }
        ],
        stream=False
    )
    
    
    analysis_result = response.choices[0].message.content
    return jsonify({'message': analysis_result})


if __name__ == '__main__':
    app.run(debug=True)
