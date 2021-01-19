Node Todo List Take Home Project

Separation of concerns

1. API Object/Class
  a. Handles all requests to the API

2. MainTemplateData Object/Class
  a. Takes in all todo data from API and creates an object with the necessary attributes to be bassed into the main Handlebars template

3. TodoList Object/Class
  a. Manipulates data from user inputs to create a todo object that can be sent to the API
  b. Uses MainTemplate object to manipulate data received from the API to a format usable by the app object 

4. App Object/Class
  a. Binds all events
  b. Works with TodoList object to render the page
  c. Works with TodoList object to update parts of the page in response to events

Reasons for Design Decisions
1. A todo class would not work well because the todo object has to be in different formats

Assumptions
1. When the modal is closed, it should reset the form

