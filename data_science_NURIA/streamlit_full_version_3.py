import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
import io as io
import base64
import matplotlib.pyplot as plt
from wordcloud import WordCloud
import nltk
from nltk.corpus import stopwords
import string
import re
from pathlib import Path

#Page configuration

#Import banner image

def get_img_as_base64(img_path: str) -> str:
    #reads the image file and encodes it to base64
    #Note:this is more portable than using the image directly, as it avoids issues with file paths in different environments.
    #we are converting the string to a Path object to ensure compatibility with different operating systems
    img_path = Path(img_path)
    with img_path.open("rb") as image_file:
        data = image_file.read()
    return base64.b64encode(data).decode("utf-8")

img_banner = get_img_as_base64(r"C:\Escritorio\talendeur\data_science_NURIA\Banner_Streamlit.png")

st.markdown(f"""
    <style>
    .fixed-banner {{
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        z-index: 9999;
        background-color: white;
        box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.1);
    }}

    .fixed-banner img {{
        width: 100%;
        height: auto;
        display: block;
    }}

    /* Add cushion or space between the banner and your text*/
    .stApp {{
        padding-top: 150px; /* Adjust the height of your banner */
    }}
    </style>

    <div class="fixed-banner">
        <img src="data:image/png;base64,{img_banner}" alt="Talendeur company banner." >
    </div>
""", unsafe_allow_html=True)




st.set_page_config(page_title="Candidate Analysis", layout="wide")
st.title("Candidate Analysis Dashboard")

#Load the data
# Note: Ensure the path to your CSV file is correct.
df = pd.read_csv(r'C:\Escritorio\talendeur\data_science_NURIA\profile_streamlit_7.csv',index_col=0)

# Assign df to df_candidate for further use
df_candidate = df
# Display the first few rows of the dataframe
#st.write("Data loaded successfully. Here are the first few rows of the dataframe:")
#st.dataframe(df_candidate.head())"



#Candidate selection as side bar

# Set up the sidebar for candidate selection
# We will use the sidebar to allow users to select a candidate from the dataframe.
st.sidebar.title("Candidate Selection")
#Define the sidebar colors
st.markdown(
    """
    <style>
        /*background*/
        section[data-testid="stSidebar"] {
            background-color: #C3CDE6;  /*using HEX color format*/
        }

        /* Texto dentro del sidebar */
        section[data-testid="stSidebar"] .css-1d391kg {
            color: white;  /*Choose the color for the text*/
        }
    </style>
    """,
    unsafe_allow_html=True
)


#select candidate
#Side note: we are using only the candidate_id column for selection to ensure anonimity.
# If you want to use other columns, you can modify this part accordingly. Remember to change from int to str if you add the name.
candidate_id = st.sidebar.selectbox("Select Candidate", df_candidate['candidate_id'].to_list())
# Filter the dataframe based on the selected candidate

df_candidate_selected = df_candidate[df_candidate["candidate_id"] == candidate_id]




#Key metrics
st.header("Key Metrics")
# Display key metrics for the selected candidate
col1, col2,col3= st.columns(3)
col1.metric("Top_degree", df_candidate_selected.iloc[0]["highest_qualification"])
col2.metric("Total experience (years)",round( df_candidate_selected.iloc[0]["total_years_experience"]))
col3.metric("Avg_years", int(df_candidate_selected.iloc[0]["avg_years_per_job"]))



#Create Leadership Index
st.header("Leadership Index")
#This section will calculate and display the leadership index for the selected candidate.
#We will compose the leadership index from the following columns:top_degree,last_job_title &certifications.
def calculate_leadership_index(row):
    score = 0
    #Check if the top_degree is an MBA
    if str(row['highest_qualification']).lower() == 'mba':
        score += 4
    #Check if the last_job_title is a leadership position
    job_title=str(row['total_years_experience']).strip().lower() 
    if 'director' in job_title:
        score += 4
    elif 'manager' in job_title:
        score += 3
    elif 'lead'  in job_title:
        score += 2
    elif 'coordinator' in job_title:
        score += 2
    #Check if the candidate has certifications in business or project management
    has_proj_cert= row.get('cert_proj_mgmt',0) > 0
    score += 1
    has_proj_cert= row.get('cert_business_mgmt',0) > 0
    score += 1

    return score
# Apply the function to calculate the leadership index for the selected candidate
leadership_individual_value= calculate_leadership_index(df_candidate_selected.iloc[0])
# Display the leadership index
st.metric("Leadership Index", f"{leadership_individual_value} / 10")
#Create a progress bar to visualize the leadership index
max_leadership_score=10
#bar_color=value_to_color = (leadership_individual_value,max_leadership_score,px.colors.sequential.Sunset)
bar_color = px.colors.sequential.Sunset[4]

fig = go.Figure(go.Bar(
    x=[leadership_individual_value],y=['Leadership Index'],
    orientation='h',marker=dict(
        color=bar_color),text=f"{leadership_individual_value} / {max_leadership_score}",
    textposition='inside',textfont=dict(size=16),insidetextanchor='middle'
    ))
# Update the layout of the progress bar
fig.update_layout(
    title='Leadership Index Progress Bar',xaxis=dict(range=[0, max_leadership_score],title='Score',showticklabels=False,visible=False),yaxis=dict(showticklabels=False,visible=False),height=100,margin=dict(l=0, r=0, t=0, b=0),showlegend=False)
st.plotly_chart(fig, use_container_width=True)

#Create a gauge chart to visualize the agile profifciency
st.header("Agile Proficiency")
#We will create a gauge chart to visualize the agile proficiency of the selected candidate.
#define the agile proficiency value
agile_score= df_candidate_selected.iloc[0]['agile']

fig= go.Figure(go.Indicator(
    mode="gauge+number",
    value=agile_score,
    title={'text': "Agile Proficiency"},
    gauge={
        'axis': {'range': [0,3]},
        'bar': {'color': "mediumorchid"},
        'steps': [
            {'range': [0,1], 'color': "lightgray"},
            {'range': [1, 2], 'color': "lightgrey"},
            {'range': [2, 3], 'color': "lightgrey"}
        ],
        'threshold': {
            'line': {'color': "black", 'width': 4},
            'thickness': 0.75,
            'value': agile_score
        }
    }
))
#Graph the figure 'gauge' chart
fig.update_layout(height=300, width=600, margin=dict(l=20, r=20, t=20, b=20))
st.plotly_chart(fig, use_container_width=True)

#Create a bar chart for the top 5 certifications areas
st.header("Top Certifications Areas")
#define the columns to use
#keeping only the columns that start with 'cert_'
cert_columns = [col for col in df_candidate_selected.columns if col.startswith('cert_')]

#define the values to use
#creates a Series with the values of the certifications for the selected candidate
# We assume that the first row contains the values for the selected candidate
cert_values = df_candidate_selected[cert_columns].iloc[0]
#In cert_df, 'values is the numeric column with the number of certifications.
#The index is the column with the certification names.
cert_df=(cert_values.to_frame(name='values').reset_index(names='cert_name'))
#Clean the certification names for better readability
cert_df['cert_name'] = cert_df['cert_name'].str.replace('cert_', '',regex=False).str.replace('_', ' ',regex=False).str.title()


# Create a bar chart function
def create_bar_chart(cert_columns, cert_values,candidate_id=candidate_id):
    #create df and clean title columns
    df_cert = pd.DataFrame({'Certifications': cert_values.values},index=[col.replace('cert_', '').replace('_', ' ').title() for col in cert_columns])                        
   
   #Modify the index to be more readable
    df_cert.reset_index(inplace=True)
    #Rename the index column to 'Category' for clarity
    df_cert.rename(columns={'index': 'Category'}, inplace=True)   
    #Keep only the top 5 certifications
    #First segment the positive values
    df_cert = df_cert[df_cert['Certifications'] > 0]
    #Sum the values by category
    total_cert=df_cert["Certifications"].sum()
    #If there are no certifications, we don't want to divide by zero
    if total_cert == 0:
        st.warning("No certifications found for the selected candidate.")
        return None
    #Calculate the percentage of each certification
    df_cert['Percentage'] = ((df_cert['Certifications'] / total_cert) * 100).round(2)
    #Sort the values by percentage and keep only the top 5
    df_cert = df_cert.nlargest(5, 'Certifications').sort_values(by='Certifications', ascending=True)
    # Create the bar chart showing the top 5 certifications and their percentages
    #Note: we are using the 'Percentage' column to show the percentage of each certification
    #Note:we are inverting 'x' and 'y' to have the categories on the y-axis and the percentages on the x-axis
    fig = px.bar(
        df_cert,
        x='Certifications',
        y='Category',
        text='Percentage',
        orientation='h',
        title=f'Top Certifications Areas for Candidate {candidate_id}',
        labels={'Percentage': 'Porcentaje (%)', 'Category': 'Categoría'},
         color='Certifications',
        color_continuous_scale=px.colors.sequential.Sunset,
    )
    # Update the layout of the chart
    fig.update_traces(texttemplate='%{y}<br>%{text:.2f}%', textposition='inside')
    fig.update_layout(uniformtext_minsize=8, uniformtext_mode='hide')
    fig.update_layout(showlegend=False)
    fig.update_xaxes(rangemode="tozero")
    return fig
#Let's call the function to create the bar chart
fig_certificaciones = create_bar_chart(cert_columns, cert_values)
if fig_certificaciones:
    st.plotly_chart(fig_certificaciones, use_container_width=True)
    st.markdown("""This chart shows the top 5 certification areas for the selected candidate, along with their respective percentages.If the candidate has a more condensed profile it may show fewer areas.""")  
else:
    st.markdown("""No certifications found for the selected candidate.""")

#Chosing most relevant areas of knowledge to show in the rose radial chart
st.header("Education Areas of Knowledge")
edu_columns=[
    "Arts_Design_Media",
    "Business_Finance_Management",
    "Education_Training",
    "Marketing_Sales",
    "STEM_Science_Technology_Engineering_Mathematics","Humanities_Social_Science","Law_Political_Science",
    "Health_Medical_Sciences","Culinary_Hospitality"
]

#Define areas of knowledge to use in the rose radial chart
areas_knowledge = [col for col in  edu_columns if col in df_candidate_selected.columns]


#We get the values for the areas of knowledge for the selected candidate.
values_areas_knowledge = df_candidate_selected[areas_knowledge].values.flatten().tolist()

df_education= pd.DataFrame({'areas' : areas_knowledge,'values': values_areas_knowledge})

fig = px.bar_polar(df_education, r='values', theta='areas', 
                   color='values', color_continuous_scale=px.colors.sequential.Sunset)

# Update the layout of the chart
fig.update_layout(
    polar=dict(
        radialaxis=dict(
            visible=True, 
            showticklabels=True,
            ticks=''
        ),
        angularaxis=dict(
            direction="clockwise",
            showgrid=True, 
            gridcolor='LightGray', 
            gridwidth=1, 
            ticks=''
        )
    ),
    showlegend=True,
    title='Education Areas of Knowledge',
    height=600, 
    width=600,
)




st.plotly_chart(fig, use_container_width=True)
st.markdown("""This chart shows the areas of knowledge for the selected candidate. The values represent the level of expertise in each area.""")

#Create a word cloud for the candidate's biography
st.header("Candidate's Bio")

nltk.download('stopwords')
#set stopwords to English
stop_words = set(stopwords.words('english'))
#Add some custom stopwords
#These are repetitive words that do not add value to the word cloud but are not in the nltk stopwords list.
custom_stopwords = {'candidate', 'profile', 'experience', 'years', 'work', 'job', 'skills', 'knowledge'}
stop_words.update(custom_stopwords)
all_stopwords = stop_words.union(set(custom_stopwords))

#define a function to clean the text
def clean_text(text):
    # Remove punctuation
    text = re.sub(r'[^\w\s]', '', text)
    # Remove numbers
    text = re.sub(r'\d+', '', text)
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    # Convert to lowercase
    text = text.lower()
    # Remove stopwords
    text = ' '.join([word for word in text.split() if word not in all_stopwords])
    return text
#Apply the clean_text function to the biography column of the selected candidate
cleaned_text=clean_text(df_candidate_selected.iloc[0]['bio'])
# Generate the word cloud
wordcloud = WordCloud(
    width=600,
    height=300,
    background_color='white',
    colormap='twilight',
    stopwords=all_stopwords,
    min_font_size=10
).generate(cleaned_text)

# Display the word cloud
fig, ax = plt.subplots(figsize=(10, 5))
ax.imshow(wordcloud, interpolation='bilinear')
ax.axis('off')  # Hide the axes
st.pyplot(fig)


