# Application Insights on Google Play Store Data
##### Team 14
##### CSE 6242 Fall 2015
&nbsp;

To run D3 visualizations which are under `Code/views/` set up a local HTTP server. Easiest way to do is using SimpleHTTPServer in Python. 


The User Interface contains three panes


1. *Overview Pane*: This pane is a compact representation of all the apps, grouped by categories
2. *Filtering and Analysis Pane*: This pane allows user to filter out the applications based on  categories, topics, number of reviews, star ratings and sentiments.
3. *Comparison Pane*: User can select upto 3 applications for comparison. Selection can be done by clicking on the nodes of the tree layout.


The usage of software is pretty much intuitive and more details can be found in `DOC/team14report.pdf`

### Description of files


**Analysis**

* Data Pre-proessing:
     * Dataset can be downloaded from [here](https://www.dropbox.com/s/06j71c9e4tw02h8/reviews-saarland.tar.gz?dl=0).
     * `Code/models/script.py` is used for pre-processing the data
     * `Code/models/wheredat.py` makes calls to WhereData API to get details about the applications
* Topic Modelling
      * `Code/models/topics_ipython121.ipynb` contains all the code for topic modelling. Data pre-processing and seniment analysis is also integrated.
* Sentiment Analysis
      * `Code/models/Sentiment.py` contains all the code for sentiment analysis

**Visualization**

* `Code/views/scripts` contains `dataFormatterScript.py`, which does all the pre-processing on the output of analysis 
* `Code/views/bubble-layout` contains data, HTML, CSS and JS files for bubble layout
* `Code/views/tree-layout` contains data, HTML, CSS and JS files for tree layout
* `Code/views/comparison-layout` contains data, HTML, CSS and JS files for comparison layout
* `Code/views/frameworks` contains JS libraries used for the project
