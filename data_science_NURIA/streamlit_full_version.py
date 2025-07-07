import streamlit as st
import plotly.graph_objects as go
import plotly.express as px
import pandas as pd

# Load the profile data
profile_streamlit = pd.read_csv('profile_streamlit.csv')

#first let's create a slect_box for candidate_id
candidate_id = st.selectbox("Select Candidate ID",profile_streamlit['candidate_id'].unique())
# Filter the DataFrame based on the selected candidate_id
filtered_df = profile_streamlit[profile_streamlit['candidate_id'] == candidate_id]

#Create some key metrics
col1, col2, col3,col4,col5 = st.columns(5)
col1.metric["Latest Job Title", filtered_df.iloc[0]['latest_job_title'])]
col2.metric("Total years of Experience", round(filtered_df.iloc[0]['latest_years_of_experience']))
col3.metric("Average yrs per job", round(filtered_df.iloc[0]['avg_years_per_job']))
col4.metric("Highest Education", filtered_df.iloc[0]['highest_qualification'])
col5.metric("Total Certificatins",int( filtered_df.iloc[0]['total_certifications']))

#Define areas of knowledge to use in the radar chart
areas_knowledge = [col for col in profile_streamlit.columns if col not in ['candidate_id', 'first_name', 'surname', 'highest_qualification', 'code_HEL',
                                                           'latest_job_title', 'total_years_f_experience', 'num_jobs', 'avg_years_per_job',
                                                           'total_certifications'] and not col.startswith('cert_')]
#We want a closed radar chart, so we need to append the first value to the end of the list
values_areas_knowledge = filtered_df[areas_knowledge].values.flatten().tolist()
values_areas_knowledge.append(values_areas_knowledge[0])  # Close the radar
labels_areas_knowledge=areas_knowledge + [areas_knowledge[0]]#labels

fig_edu = go.Figure(
    data=go.Scatterpolar(
        r=areas_knowledge + [areas_knowledge[0]],  # Close the radar
        theta=values_areas_knowledge,
        fill='toself',
        name='Education Level',
        line=dict(color='blue')
    )
)
fig_edu.update_layout(
    polar=dict(radialaxis=dict(visible=True, range=[0, max(values_edu)+1])),
    showlegend=True,
    title='Education Areas of Knowledge'
)
fig_edu.update_layout(title='Education Areas of Knowledge',)

#Create another radar chart for certifications
certifications = [col for col in profile_streamlit.columns if col.startswith('cert_')]
values_certifications = filtered_df[certifications].values.flatten().tolist()
values_certifications.append(values_certifications[0])  # Close the radar
labels_certifications = certifications + [certifications[0]]  # Labels
fig_cert = go.Figure(
    data=go.Scatterpolar(
        r=values_certifications,
        theta=labels_certifications,
        fill='toself',
        name='Certifications',
        line=dict(color='green')
    )
)
fig_cert.update_layout(title='Certifications Areas of Interest')