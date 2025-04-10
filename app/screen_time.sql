-- Create a new database named 'screen_time'
CREATE DATABASE screen_time;

-- Select the 'screen_time' database for use
USE screen_time;

-- Create a table to store screen time data for children
CREATE TABLE children_screen_time (
    age INT,                                      -- Age of the child
    gender VARCHAR(50),                           -- Gender of the child
    screen_time_type VARCHAR(100),                -- Type of screen time (e.g., educational, entertainment)
    day_type VARCHAR(50),                         -- Type of day (e.g., weekday, weekend)
    average_screen_time_hours FLOAT,              -- Average screen time in hours
    sample_size INT                               -- Sample size for the data point
);

-- Create a table to store general screen time data across various demographics
CREATE TABLE general_screen_time (
    id INT,                                       -- Unique identifier
    age_group VARCHAR(50),                        -- Age group (e.g., 18-24, 25-34)
    gender VARCHAR(20),                           -- Gender
    education_level VARCHAR(100),                 -- Education level of the respondent
    occupation VARCHAR(100),                      -- Occupation of the respondent
    average_screen_time VARCHAR(50),              -- Average screen time (can be in range or category)
    device VARCHAR(100),                          -- Type of device used (e.g., smartphone, tablet)
    screen_activity VARCHAR(100),                 -- Type of screen activity (e.g., social media, work)
    app_category VARCHAR(100),                    -- Category of apps used
    screen_time_period VARCHAR(50),               -- Time period during which screen time was measured
    environment VARCHAR(100),                     -- Environment where screen time occurs (e.g., home, work)
    productivity VARCHAR(50),                     -- Self-reported productivity level
    attention_span VARCHAR(50),                   -- Attention span associated with screen time
    work_strategy VARCHAR(100),                   -- Work strategy used (e.g., Pomodoro, deep work)
    notification_handling VARCHAR(100),           -- How notifications are handled (e.g., Do Not Disturb)
    usage_of_productivity_apps VARCHAR(100)       -- Usage of productivity-enhancing applications
);

-- Modify the 'productivity' column to increase its length for more detailed responses
ALTER TABLE general_screen_time
MODIFY COLUMN productivity VARCHAR(255);

-- Load data into the 'general_screen_time' table from a CSV file
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.4/Uploads/Cleaned_General_Screen_Time_Data.csv'
INTO TABLE general_screen_time
FIELDS TERMINATED BY ','                         -- Fields in the CSV are separated by commas
ENCLOSED BY '"'                                  -- Fields are enclosed in double quotes
LINES TERMINATED BY '\n'                         -- Each record ends with a newline
IGNORE 1 ROWS;                                   -- Skip the header row in the CSV file

-- Load data into the 'children_screen_time' table from a CSV file
LOAD DATA INFILE 'C:/ProgramData/MySQL/MySQL Server 8.4/Uploads/Cleaned_Children_s_Screen_Time_Data.csv'
INTO TABLE children_screen_time
FIELDS TERMINATED BY ','                         -- Fields in the CSV are separated by commas
ENCLOSED BY '"'                                  -- Fields are enclosed in double quotes
LINES TERMINATED BY '\n'                         -- Each record ends with a newline
IGNORE 1 ROWS;                                   -- Skip the header row in the CSV file

-- Check the secure_file_priv system variable to confirm the directory allowed for LOAD DATA INFILE
SHOW VARIABLES LIKE 'secure_file_priv';

-- Display all data from the 'children_screen_time' table
SELECT * FROM children_screen_time;

-- Display all data from the 'general_screen_time' table
SELECT * FROM general_screen_time;

