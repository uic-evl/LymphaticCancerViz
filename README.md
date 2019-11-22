# LymphaticCancerViz

#### Overview
This project visualizes the chain of lymph nodes for patients in a cohort of head and neck cancer patients.
Spread to Lymph nodes is a general predictor of patient survival in these cases.  
This is part of a larger project to extend this to predict risk of post-treatment side effects for patients after successful radiation treatment.

This project also includes an unsupervised machine learning approach, where we have created ways of measuring the similarity between patients patients and lymph nodes.
We've performed clustering using this similarity metric.

##### The Interface
The Visualization is done in javascript and can be viewed in the browser.  Because of the sensitive nature of the data, only a synthetic dataset is avaliable for public viewing.

Upon loading the user can select patients to view based on id or cluster. 
For ID, we show the affected nodes of the patient, followed by the patients in order of similarity.

For clustering, the user can view the results of clustering using different metrics.  Users can look at these clusters based on when we use a set number (6) of clusters, or clusters with only identical or extremely similar patterns.
Because the data in this repo is synthetically generated, the clusters should show no correlation with toxicity.

##### The Data
This repo currently uses synthetic data based on the original private dataset.  For a demo of what the dataset look like, see [here](https://github.com/uic-evl/LymphaticCancerViz/blob/master/synthetic_data/CohortAnalysis.ipynb)
