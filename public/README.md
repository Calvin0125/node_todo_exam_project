Node Todo List Take Home Project

Separation of concerns

1. API Object
  a. Handles all requests to the API

2. TodoList Object
  a. Manipulates data from user inputs to create an object that can be sent to the API
  b. Manipulates data received from the API to a format usable by the app object 

3. App Object
  a. Binds all events
  b. Works with TodoList object to render the page
  c. Works with TodoList object to update parts of the page in response to events

