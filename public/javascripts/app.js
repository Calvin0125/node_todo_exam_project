class API {
  add(todo, callback) {
    $.ajax({
      type: 'post',
      url: '/api/todos',
      data: JSON.stringify(todo),
      contentType: 'application/json',
      complete: callback,
    });
  }

  edit(todo, id, callback) {
    $.ajax({
      type: 'put',
      url: `/api/todos/${id}`,
      data: JSON.stringify(todo),
      contentType: 'application/json',
      complete: callback,
    });
  }

  getAllTodos(callback) {
    $.get('/api/todos', callback, 'json');
  }

  getTodo(id, callback) {
    $.get(`/api/todos/${id}`, callback, 'json');
  }

  delete(id, callback) {
    $.ajax({
      type: 'delete',
      url: `/api/todos/${id}`,
      success: callback,
    });
  }

  toggleComplete(id, callback) {
    this.getTodo(id, data => {
      let completed = data.completed;
      $.ajax({
        type: 'put',
        url: `/api/todos/${id}`,
        data: JSON.stringify({completed: !completed}),
        contentType: 'application/json',
        success: callback,
      });
    });
  }
}

class MainTemplateData {
  constructor(todos, currentSectionKey, title) {
    this.todos = this.makeTodosArray(todos);
    this.todos_by_date = this.getTodosByDate();
    this.done = this.getCompletedTodos();
    this.done_todos_by_date = this.getDoneTodosByDate();
    this.selected = this.getSelectedTodos(currentSectionKey, title);
    this.current_section = this.getCurrentSection(currentSectionKey, title);
  }

  makeTodosArray(todos) {
    return todos.map(this.templateTodoFromAPITodo, this);
  }

  templateTodoFromAPITodo(apiTodo) {
    let templateTodo = {};
    templateTodo.id = apiTodo.id;
    templateTodo.title = apiTodo.title;
    templateTodo.completed = apiTodo.completed;
    templateTodo.due_date = this.getDueDateFromAPITodo(apiTodo);
    return templateTodo;
  }

  getDueDateFromAPITodo(apiTodo) {
    if (+apiTodo.month > 0 && +apiTodo.year > 0) {
      return apiTodo.month + '/' + apiTodo.year.slice(2);
    } else {
      return 'No Due Date';
    }
  }

  getTodosByDate() {
    let uniqueDates = this.getUniqueDates(this.todos);
    let todosByDate = {}
    uniqueDates.forEach(date => {
      todosByDate[date] = this.todos.filter(todo => todo.due_date === date);
    });

    return todosByDate;
  }

  getUniqueDates(todos) {
    let uniqueDates = [];
    todos.forEach(todo => {
      if (!uniqueDates.includes(todo.due_date)) {
        uniqueDates.push(todo.due_date);
      }
    });

    return this.sortDates(uniqueDates);
  }

  sortDates(uniqueDates) {
    // date format mm/yy
    return uniqueDates.sort((a, b) => {
      if (a === b) {
        return 0;
      } else if (!/\d/.test(a)) {
        return -1;
      } else if (!/\d/.test(b)) {
        return 1;
      } else if (a.slice(3) === b.slice(3)) {
        return +a.slice(0, 2) - +b.slice(0, 2);
      } else {
        return +a.slice(3) - +b.slice(3);
      }
    });
  }

  getCompletedTodos() {
    return this.todos.filter(todo => {
      return todo.completed;
    });
  }

  getDoneTodosByDate() {
    let uniqueDates = this.getUniqueDates(this.done);
    let doneTodosByDate = {};
    uniqueDates.forEach(date => {
      doneTodosByDate[date] = this.done.filter(todo => {
        return todo.due_date === date;
      });
    });

    return doneTodosByDate;
  }

  getSelectedTodos(currentSectionKey, title) {
    let selectedTodos;
    if (currentSectionKey.includes('date')) {
      title = title.replace(/completed/i, '');
      selectedTodos = this[currentSectionKey][title] || [];
    } else {
      selectedTodos = this[currentSectionKey];
    }

    return this.sortByCompleted(selectedTodos);
  }

  sortByCompleted(todos) {
    return todos.sort((a, b) => {
      if (a.completed && b.completed) {
        return 0;
      } else if (a.completed) {
        return 1;
      } else if (b.completed) {
        return -1;
      }
    });
  }

  getCurrentSection(currentSectionKey, title) {
    let total;
    if (currentSectionKey.includes('date')) {
      title = title.replace(/completed/i, '');
      total = this[currentSectionKey][title] ? 
              this[currentSectionKey][title].length : 0;
    } else {
      total = this[currentSectionKey].length;
    }

    return {title, total};
  }
}

class TodoList {
  constructor() {
    this.api = new API();
  }

  addTodoFromForm(callback) {
    let todo = this.makeTodoObjectFromForm();
    this.api.add(todo, callback);
  }

  editTodoFromForm(id, callback) {
    let todo = this.makeTodoObjectFromForm();
    this.api.edit(todo, id, callback);
  }

  makeTodoObjectFromForm() {
    let $form = $('#form_modal');
    let $userInputs = $form.find('select, input[type="text"], textarea');
    return this.makeTodoObjectFromInputs($userInputs);
  }

  makeTodoObjectFromInputs($userInputs) {
    let todo = {}
    $userInputs.each((_, input) => {
      todo[input.id] = input.value;
    });
    
    if (todo.description === '') {
      todo.description = '!none!';
    }

    return todo;
  }

  makeMainTemplateObject(callback, currentSectionKey, title) {
    this.api.getAllTodos((data) => {
      let mainTemplateData = new MainTemplateData(data, currentSectionKey, title);
      this.mainTemplateData = mainTemplateData;
      callback(mainTemplateData);
    });
  }

  makeListTemplateObject(currentSectionKey, title) {
    return this.mainTemplateData.getSelectedTodos(currentSectionKey, title);
  }

  makeTitleTemplateObject(currentSectionKey, title) {
    return this.mainTemplateData.getCurrentSection(currentSectionKey, title);
  }

  populateModalInputs(id) {
    this.api.getTodo(id, (todo) => {
      Object.keys(todo).forEach(key => {
        if (key === 'id' || key === 'completed') {
          return;
        }

        this.populateSingleInput(todo, key);
      });
    });
  }

  populateSingleInput(todo, key) {
    let $input = $(`#${key}`);
    if ($input.prop('tagName') === 'SELECT') {
      $input.find(`option[value="${todo[key]}"]`).attr('selected', 'selected');
    } else if (todo[key] === '!none!') {
      $input.val('');
    } else {
      $input.val(todo[key]);
    }
  }

  markComplete(id, callback) {
    this.api.getTodo(id, (todo) => {
      if (todo.completed) {
        callback(todo.completed);
      } else {
        this.api.toggleComplete(id, () => {
          callback(todo.completed);
        });
      }
    });
  }
}

class App {
  constructor() {
    this.todoList = new TodoList();
    this.mainTemplate = Handlebars.compile($('#main_template').html());
    this.listTemplate = Handlebars.compile($('#list_template').html());
    this.titleTemplate = Handlebars.compile($('#title_template').html());
    this.registerPartials();
    this.loadPage();
  }

  registerPartials() {
    $('[data-type="partial"]').each((_, partial) => {
      Handlebars.registerPartial(`${partial.id}`, `${$(partial).html()}`);
    });
  }

  loadPage(currentSectionTemplateKey = 'todos', currentSectionTitle = 'All Todos') {
    $('body').empty();
    this.todoList.makeMainTemplateObject((mainTemplateObject) => {
      $('body').append(this.mainTemplate(mainTemplateObject));
      $(`[data-title="${currentSectionTitle}"]`).addClass('active');
      this.bindEvents();
    }, currentSectionTemplateKey, currentSectionTitle);
  }

  reloadPage() {
    let currentSectionTemplateKey = $('.active').attr('data-template-key');
    let currentSectionTitle = $('.active').attr('data-title');
    this.loadPage(currentSectionTemplateKey, currentSectionTitle);
  }

  bindEvents() {
    $('label[for="new_item"').on('click', $.proxy(this.handleNewItemClick, this));
    $('#modal_layer').on('click', $.proxy(this.handleModalLayerClick, this));
    $('#submit-modal-form').on('click', $.proxy(this.handleSaveClick, this));

    // 2nd argument limits event to elements that represent a todo subset
    $('#sidebar').on('click', '[data-title]', $.proxy(this.handleSidebarClick, this));
    $('#list-template-parent').on('click', 'td.list_item', $.proxy(this.handleTodoItemClick, this));
    $('#list-template-parent').on('click', 'td.delete', $.proxy(this.handleDeleteClick, this));
    $('#list-template-parent').on('click', 'label', $.proxy(this.handleTodoTextClick, this));
    $('#mark-complete').on('click', $.proxy(this.handleMarkCompleteClick, this));
  }

  handleNewItemClick() {
    $('#form_modal').attr('data-action', 'add');
    this.showModal();
  }

  showModal() {
    $('#form_modal').fadeIn();
    $('#modal_layer').fadeIn();
  }

  handleModalLayerClick() {
    this.resetAndHideModal();
  }

  resetAndHideModal() {
    $('#form_modal').fadeOut();
    $('#modal_layer').fadeOut();
    $('#form_modal select option').removeAttr('selected');
    $('#form_modal form')[0].reset();
  }

  handleSaveClick(event) {
    event.preventDefault();
    let action = $('#form_modal').attr('data-action');
    if (action === 'add') {
      this.addTodo();
    } else if (action === 'edit') {
      let id = $(event.target).attr('data-id');
      this.editTodo(id);
    }
  }

  addTodo() {
    this.todoList.addTodoFromForm((_, status) => {
      if (status === 'error') {
        alert('The todo could not be added. Please enter a title at least 3 characters long.');
        return;
      }
      this.resetAndHideModal();
      this.loadPage();
    });
  }

  editTodo(id) {
    this.todoList.editTodoFromForm(id, (_, status) => {
      if (status === 'error') {
        alert('The todo could not be updated. Please enter a title at least 3 characters long.');
        return;
      }
      this.resetAndHideModal();
      this.reloadPage();
    });
  }

  handleSidebarClick(event) {
    $('.active').removeClass('active');
    let $currentSection = $(event.target).closest('[data-title]')
    $currentSection.addClass('active');
    let currentSectionKey = $currentSection.attr('data-template-key');
    let title = $currentSection.attr('data-title');
    this.reloadMainArea(currentSectionKey, title);
  }

  reloadMainArea(currentSectionKey, title) {
    let titleTemplateObject = this.todoList.makeTitleTemplateObject(currentSectionKey, title);
    $('#title-template-parent').empty()
    $('#title-template-parent').append(this.titleTemplate({current_section: titleTemplateObject}));

    let listTemplateObject = this.todoList.makeListTemplateObject(currentSectionKey, title);
    $('#list-template-parent').empty()
    $('#list-template-parent').append(this.listTemplate({selected: listTemplateObject}));
  }

  handleTodoItemClick(event) {
    if (event.target.tagName === 'LABEL') {
      event.preventDefault();
      return;
    }

    let id = $(event.target).closest('tr').attr('data-id');
    this.todoList.api.toggleComplete(id, () => {
      this.reloadPage();
    });
  }

  handleTodoTextClick(event) {
    event.preventDefault();
    let id = $(event.target).closest('tr').attr('data-id');
    $('#submit-modal-form').attr('data-id', id);
    $('#form_modal').attr('data-action', 'edit');
    this.todoList.populateModalInputs(id);
    this.showModal();
  }

  handleDeleteClick(event) {
    let id = $(event.target).closest('tr').attr('data-id');
    this.todoList.api.delete(id, () => {
      this.reloadPage();
    });
  }

  handleMarkCompleteClick(event) {
    event.preventDefault();
    if ($('#form_modal').attr('data-action') === "add") {
      alert("Cannot mark complete as item has not yet been created.");
    } else {
      let id = $('#submit-modal-form').attr('data-id');
      this.markComplete(id);
    }
  }

  markComplete(id) {
    this.todoList.markComplete(id, (completed) => {
      if (completed) {
        this.resetAndHideModal();
      } else {
        this.reloadPage();
      }
    });
  }
}

$(() => new App());