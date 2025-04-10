from flask import Flask, render_template, request, jsonify
from datetime import datetime, timedelta
from models import db, Event
import calendar
from openai import OpenAI
import json

app = Flask(__name__,template_folder='../templates',static_folder='../static') 
# Create a virtual DB, gonna be replaced to real DB in the future
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///calendar.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)
# Connect to the deepseek
client = OpenAI(api_key="sk-02e20ead4b434e64b235311055365479", base_url="https://api.deepseek.com")
# One table is ok so only create once
@app.before_request
def create_tables():
    db.create_all()
# Get a list of all dates in the current week (Monday to Sunday)
def get_week_dates(base_date=None):
    if base_date is None:
        base_date = datetime.today()
    start = base_date - timedelta(days=base_date.weekday())
    return [(start + timedelta(days=i)).date() for i in range(7)] # List of 7 dates
# Home page
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/epic1')
def epic1():
    return render_template('epic1.html')

# Weekly calendar display (Epic 2)
@app.route('/epic2')
def epic2():
    week_dates = get_week_dates()
    events = Event.query.filter(Event.date.in_(week_dates)).all() # Query all events for the current week
    events_by_day = {d: [] for d in week_dates}
    for event in events:
        events_by_day[event.date].append(event)  # Group events by date
    return render_template('calendar.html', week_dates=week_dates, events_by_day=events_by_day)

@app.route('/add', methods=['POST'])
def add_event():
    data = request.get_json()
    event = Event(
        date=datetime.strptime(data['date'], '%Y-%m-%d').date(), # Convert string to date object
        title=data['title'],
        description=data.get('description', ''),
        start_time=datetime.strptime(data['start_time'], '%H:%M').time(),
        end_time=datetime.strptime(data['end_time'], '%H:%M').time()
    )
    db.session.add(event)
    db.session.commit()
    return jsonify({'status': 'success'})
@app.route('/epic2/delete',methods=['POST'])
def delete_event():
    data = request.get_json()
    date_to_delete=datetime.strptime(data['date'], '%Y-%m-%d').date() # Convert date string
    Event.query.filter_by(date=date_to_delete).delete() # Delete all events on that date
    db.session.commit()
    return jsonify({'status': 'deleted'})

#Get response from deepseek
@app.route('/recommendation',methods=['POST'])
def get_recommendation():
    data=request.get_json()
    input_text=data.get('input')
    # Send a chat completion request to the DeepSeek model
    response=client.chat.completions.create(
        model='deepseek-chat',
        messages=[
            {"role": "system", "content": "You are Children digital life specialist"},
            {"role": "user", "content": 'Talk about how doing the following activity helps balance childrends digital life, if the following is not an activity but an area of interest suggest online/outdoor activites that are related to that activity'+input_text},
        ],
        stream=False # single complete response, not streamed
    )
    result=response.choices[0].message.content # Extract the text content of the AI's reply
    return jsonify({'message': result})


# A test function, maybe use in the future
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
    #get data from the front end
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
        # format for deepseek
        messages=[
            {
                "role": "system", 
                "content": "You are Children digital life specialist"
            },
            {
                "role": "user", 
                "content": f"""Please analyse if the activities on day {day} is optimal：
                {json.dumps(events_data, indent=2, ensure_ascii=False)}
                
                Requirements：
                1. Health rating:（1-5）
                2. Main problem
                3. Recommendations for improvements:
                """
            }
        ],
        stream=False
    )
    
    
    analysis_result = response.choices[0].message.content
    return jsonify({'message': analysis_result})


@app.route('/get-age-recommendation',methods=['POST'])
def get_age_recommendation():
    data = request.get_json()
    age = data.get('age')
    if age is None:
        return jsonify({'recommendation': 'No age provided'}), 400
    response=client.chat.completions.create(
        # Same operation of AI
        model='deepseek-chat',
        messages=[
            {
                'role':'system',
                'content':'You are Children digital life specialist'
            },
            {
                'role':'user',
                'content':f"""Please give suggestions for children aged:{age} everyday screentime"""
            }
        ],
        stream=False
    )
    analysis_result = response.choices[0].message.content
    return jsonify({'recommendation': analysis_result})




if __name__ == "__main__":
    app.run(debug=True)