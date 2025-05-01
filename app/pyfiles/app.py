from flask import Flask, render_template, request, jsonify,Blueprint
from datetime import datetime, timedelta
from models import db, Event
import calendar
from openai import OpenAI
import json
import random
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql.expression import func
import uuid
from io import BytesIO
import requests
import pymysql
pymysql.install_as_MySQLdb()
app = Flask(__name__,template_folder='../templates',static_folder='../static') 

OPTIC_ENDPOINT = "https://api.aiornot.com/v1/detect"

PASSWORD='fit5120ta03'

# Create a virtual DB, gonna be replaced to real DB in the future
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+pymysql://fit5120:fit5120ta03@fit5120.cja0m8k6e2fo.ap-southeast-2.rds.amazonaws.com:3306/fit5120main'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

import pymysql
pymysql.install_as_MySQLdb()

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
@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        if request.form.get('password') == PASSWORD:
            return render_template('index.html')  # Load homepage after successful authentication
        else:
            return render_template('login.html', error='Incorrect password')  # Show error message
    return render_template('login.html')  # Show login page on first visit

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

class CyberStory(db.Model):
    __tablename__ = 'cyber_story'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    content = db.Column(db.String(999))
    moral = db.Column(db.String(400))


@app.route('/story')
def story_page():
    return render_template('story.html')

@app.route('/api/stories')
def get_stories():
    page = int(request.args.get('page', 1))
    per_page = 1
    stories = CyberStory.query.paginate(page=page, per_page=per_page, error_out=False)
    
    data = [{
        'id': s.id,
        'title': s.title,
        'content': s.content,
        'moral': s.moral
    } for s in stories.items]

    return jsonify({
        'stories': data,
        'has_next': stories.has_next,
        'has_prev': stories.has_prev,
        'current_page': page
    })
@app.route('/api/stories/random')
def get_random_story():
    total = CyberStory.query.count()
    offset = random.randint(0, total - 1)
    story = CyberStory.query.offset(offset).limit(1).first()

    
    per_page = 1
    page = (offset // per_page) + 1

    return jsonify({
        'id': story.id,
        'title': story.title,
        'content': story.content,
        'moral': story.moral,
        'page': page
    })





# Sightengine API account
API_USER = '965122208'
API_SECRET = '6ysrqwweiPV9V967LiPLSg8ZhC5rRKCV'

SIGHTENGINE_URL = 'https://api.sightengine.com/1.0/check.json'

@app.route('/detect/')
def detect_page():
    return render_template('detect.html')

def detect_image(file=None, image_url=None, image_file=None):
    # check image_file first
    if image_file:
        file = image_file  # if image_file，use as file
    if file:
        files = {'media': (file.name, file, 'image/jpeg')}
        data = {
            'models': 'genai',
            'api_user': API_USER,
            'api_secret': API_SECRET
        }
        response = requests.post(SIGHTENGINE_URL, files=files, data=data)
    elif image_url:
        params = {
            'url': image_url,
            'models': 'genai',
            'api_user': API_USER,
            'api_secret': API_SECRET
        }
        response = requests.get(SIGHTENGINE_URL, params=params)
    else:
        raise ValueError("No file or image_url provided")

    return response.json()



@app.route('/detect/api', methods=['POST'])  


def detect_api():
    print('Entering detect_api method')

    # Default: no file or URL
    image_file = None

    # If a file is uploaded
    if 'file' in request.files:
        file = request.files['file']
        if file.filename != '':
            image_file = file

    # If no file, but an image URL is provided
    if not image_file and 'image_url' in request.form:
        image_url = request.form['image_url']
        if image_url.startswith('http://') or image_url.startswith('https://'):
            try:
                resp = requests.get(image_url, timeout=5)
                resp.raise_for_status()
                # Load image content from URL into memory
                image_file = BytesIO(resp.content)
                image_file.name = "downloaded.jpg"
            except Exception as e:
                print('Failed to download image from URL', e)
                return jsonify({"error": "Failed to download image"}), 400

    # If no file or valid URL is provided, return an error
    if not image_file:
        return jsonify({"error": "No valid image provided"}), 400

    # Call for image detection
    result = detect_image(image_file=image_file)

    # Output detection result
    print('Sightengine returned:', result)

    #Parse and return human-readable result
    ai_score = result.get('type', {}).get('ai_generated', 0)  # AI generation score
    verdict = 'AI Generated' if ai_score >= 0.5 else 'Not AI Generated'  # Determine if AI generated

    #Return detailed results
    return jsonify({
        "id": str(uuid.uuid4()),  #Return a unique request ID
        "report": {
            "verdict": verdict,  #AI generation verdict 
            "ai_score": ai_score,  # AI generation score
            "image_uri": result.get('media', {}).get('uri', ''),  #the URL of the detected image
        },
        "created_at": datetime.utcnow().isoformat() + "Z"  #return the timestamp of the request
    })


if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0',port=5000)