Node Todo List Take Home Project

Separation of concerns

1. Todo Object
  a. add, update, and delete todos by sending requests to the API

2. TodoList Object
  a. Requests all todos from the server
  b. Creates object to be passed into main template based on response to requesting all todos

3. App Object
  a. Binds all events
  b. Works with TodoList object to render the page
  c. Works with TodoList object to update parts of the page in response to events
  
