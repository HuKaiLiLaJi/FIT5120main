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
#    if request.method == 'POST':
#        if request.form.get('password') == PASSWORD:
#            return render_template('index.html')  # Load homepage after successful authentication
#        else:
#           return render_template('login.html', error='Incorrect password')  # Show error message
    return render_template('index.html')  # Show login page on first visit

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



# ------------Iteration 2 ----------------



# Define a SQLAlchemy model for cyber stories
class CyberStory(db.Model):
    __tablename__ = 'cyber_story'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100))
    content = db.Column(db.String(999))
    moral = db.Column(db.String(400))


@app.route('/story')
def story_page():
    return render_template('story.html')
# API endpoint to get paginated list of stories
@app.route('/api/stories')
def get_stories():
    page = int(request.args.get('page', 1))# Get the page number from query string default 1
    per_page = 1
    stories = CyberStory.query.paginate(page=page, per_page=per_page, error_out=False)
    
    # Format the stories into a list of dictionaries
    data = [{
        'id': s.id,
        'title': s.title,
        'content': s.content,
        'moral': s.moral
    } for s in stories.items]

    return jsonify({          # Return story data with pagination info
        'stories': data,
        'has_next': stories.has_next,
        'has_prev': stories.has_prev,
        'current_page': page
    })
 # API endpoint to get a random story   
@app.route('/api/stories/random')
def get_random_story():
    total = CyberStory.query.count()
    offset = random.randint(0, total - 1)
    story = CyberStory.query.offset(offset).limit(1).first()

    
    per_page = 1
    page = (offset // per_page) + 1# Calculate which page this story would appear on

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
# Route for the AI image detector webpage
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
    elif image_url:         # If image_url is provided, send it as query parameters
        params = {
            'url': image_url,
            'models': 'genai',
            'api_user': API_USER,
            'api_secret': API_SECRET
        }
        response = requests.get(SIGHTENGINE_URL, params=params)
    else:         # If neither file nor image_url is provided, raise an error
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
                resp.raise_for_status() # Load image content from URL into memory
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


# ------------Iteration 3 -------------------------------------

class ActivityEntry(db.Model):
    __tablename__ = 'activity_entries'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    activity_name = db.Column(db.String(255), nullable=False)
    enjoyment = db.Column(db.Integer, nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    activeness = db.Column(db.Integer, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='activity_entries')

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False, unique=True)

class Activity(db.Model):
    __tablename__ = 'activities'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    description = db.Column(db.String(500), nullable=True)
    
@app.route('/activities', methods=['GET', 'POST', 'DELETE'])
def manage_activities():
    # adding a new activity
    if request.method == 'POST':
        data = request.json
        name = data.get('name')
        description = data.get('description', '')  # Use an empty string as the default 
        
        # Validate the activity name is provided
        if not name:
            return jsonify({'error': 'Activity name is required.'}), 400
        
        # Create a new activity 
        new_activity = Activity(name=name, description=description)
        db.session.add(new_activity)
        db.session.commit()
        
        return jsonify({'message': 'Activity added successfully!'}), 201
    
    # delete an existing activity
    elif request.method == 'DELETE':
        activity_id = request.args.get('id')
        
        # Validate the activity ID is provided
        if not activity_id:
            return jsonify({'error': 'Activity ID is required.'}), 400
        
        # Find the activity by ID
        activity = Activity.query.get(activity_id)
        
        # Check if the activity exists
        if not activity:
            return jsonify({'error': 'Activity not found.'}), 404
        
        # Delete 
        db.session.delete(activity)
        db.session.commit()
        
        
        return jsonify({'message': 'Activity deleted successfully!'}), 200
    
    # retrieving all activities
    else:
        activities = Activity.query.all()
        
        # Return the list of activities as JSON
        return jsonify([{'id': a.id, 'name': a.name, 'description': a.description} for a in activities]), 200

    
    
@app.route('/activity-entries', methods=['POST'])
def add_activity_entry():
    # Get the JSON data 
    data = request.json
    
    # Extract required fields
    user_id = data.get('user_id')
    activity_name = data.get('activity_name')
    enjoyment = data.get('enjoyment')
    amount = data.get('amount')
    activeness = data.get('activeness')
    
    # Validate all required fields 
    if not all([user_id, activity_name, enjoyment, amount, activeness]):
        return jsonify({'error': 'All fields are required.'}), 400
    
    # Create
    new_entry = ActivityEntry(
        user_id=user_id,
        activity_name=activity_name,
        enjoyment=enjoyment,
        amount=amount,
        activeness=activeness
    )
    
    # Add the new entry to the database 
    db.session.add(new_entry)
    db.session.commit()
    
    
    return jsonify({'message': 'Activity entry added successfully!'}), 201





@app.route('/child-journal')
def child_journal():
    return render_template('journal.html')

@app.route('/parent')
def parent():
    return render_template('parent.html')

@app.route('/visual')
def visual():
    return render_template('visual.html')

@app.route('/activity-entries', methods=['GET'])
def get_activity_entries():
    # Extract query parameters 
    user_id = request.args.get('user_id')
    year = request.args.get('year')
    week = request.args.get('week')

    # Validate required parameters 
    if not user_id or not year or not week:
        return jsonify({'error': 'Missing required parameters'}), 400

    #Convert year and week to integers
    try:
        year = int(year)
        week = int(week)
    except ValueError:
        return jsonify({'error': 'Year and week must be integers'}), 400

    # Calculate the start and end dates
    try:
        start_date = datetime.strptime(f"{year}-W{week}-1", "%Y-W%W-%w")
        end_date = start_date + timedelta(days=6, hours=23, minutes=59, seconds=59)
    except ValueError:
        return jsonify({'error': 'Invalid year or week format'}), 400

    
    #print(f"Start Date: {start_date}, End Date: {end_date}")

    # Query the database for activity entries 
    entries = ActivityEntry.query.filter(
        ActivityEntry.user_id == int(user_id),
        ActivityEntry.timestamp >= start_date,
        ActivityEntry.timestamp <= end_date
    ).all()

    # Format the results 
    results = [
        {
            'activity_name': entry.activity_name,
            'enjoyment': entry.enjoyment,
            'amount': entry.amount,
            'activeness': entry.activeness,
            'timestamp': entry.timestamp.strftime('%Y-%m-%d')
        }
        for entry in entries
    ]

    # Return the results 
    return jsonify(results), 200




@app.route('/generate-summary', methods=['GET'])
def generate_summary():
    # Extract query parameters 
    user_id = request.args.get('user_id')
    year = request.args.get('year')
    week = request.args.get('week')

    # Validate  required parameters 
    if not user_id or not year or not week:
        return jsonify({'error': 'Missing required parameters'}), 400

    # Calculate the start and end dates 
    try:
        start_date = datetime.strptime(f"{year}-W{int(week)}-1", "%Y-W%W-%w")
        end_date = start_date + timedelta(days=6)
    except ValueError:
        return jsonify({'error': 'Invalid year or week format'}), 400

    # Debug print for date range
    #print(start_date, end_date)

    # Query the database 
    entries = ActivityEntry.query.filter(
        ActivityEntry.user_id == int(user_id),
        ActivityEntry.timestamp >= start_date,
        ActivityEntry.timestamp <= end_date
    ).all()

    # Return a message if no activities 
    if not entries:
        return jsonify({'summary': 'No activities found for the selected week.'}), 200

    # activity text for the summary prompt
    activity_texts = [
        f"{entry.activity_name} (Enjoyment: {entry.enjoyment}, Time(hour): {entry.amount}, Activeness: {entry.activeness})"
        for entry in entries
    ]
    prompt = f"Summarize the following activities for user {user_id} during week {week}:\n" + "\n".join(activity_texts)

    # Call the DeepSeek API to generate the summary
    try:
        response = client.chat.completions.create(
            model="deepseek-chat",
            messages=[
                {"role": "system", "content": "You are a helpful assistant, helping parents analyze child's behavior"},
                {"role": "user", "content": prompt},
            ],
            stream=False
        )
        # Extract the summary from the response
        summary = response.choices[0].message.content.strip()
    except Exception as e:
        # Return an error if the API call fails
        return jsonify({'error': 'Failed to generate summary. Please try again later.'}), 500

    # Return the generated summary 
    return jsonify({'summary': summary}), 200





if __name__ == "__main__":
    app.run(debug=True,host='0.0.0.0',port=8080)