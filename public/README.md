Node Todo List Take Home Project

Separation of concerns

1. API Object/Class

  * Handles all requests to the API

2. MainTemplateData Object/Class

  * Takes in all todo data from API and creates an object with the necessary attributes to be passed into the main Handlebars template

3. TodoList Object/Class

  * Manipulates data from user inputs to create a todo object that can be sent to the API

  * Uses MainTemplateData object to manipulate data received from the API to a format usable by the App object 

4. App Object/Class

  * Binds all events

  * Works with TodoList object to render the page

  * Works with TodoList object to update parts of the page in response to events

Reasons for Design Decisions

1. A todo class would not work well because the todo object has to be in different formats depending on how it is used, and would result in too much unnecessary code. 

2. Rather than use the error attribute on the object passed to $.ajax, an if statement is used to check if the request failed. This is because the error function was running every time, regardless of success or failure. After spending over an hour reading the documentation and trying different things, I decided to use the if statement so that I could continue with the project. 

3. The API object is accessible to the App object through the TodoList object. This is because some of the requests only require an ID and do not have to do anything with the response, so it was unnecessary to add an intermediate method to the TodoList object to manipulate the data. 

4. I added the string 'completed' to the data-title attribute for completed to the dl element in the completed list template so that no sidebar list titles have the same data-title attribute. This allows a single list title to be selected more easily. 

Assumptions
1. When the modal is closed, it should reset the form.

2. When "Mark as Complete" is clicked, any changes entered into the field should not be applied to the todo.

3. A user will not enter a description of '!none!'. The API does not update when an empty string is sent for description, so a string with characters must be sent to remove the description. 

4. Duplicate todos are allowed because a user might want to add something twice, and they can be differentiated by their ID.

5. If editing the todo causes the currently selected group to disappear, the header will show the group with a count of 0, the todo list will appear empty, and no sidebar group will be selected. 

6. The user will be using the newest version of Google Chrome.

7. If a todo is already complete, clicking mark as complete only closes the modal. 

