class API {
  add(todo) {
    $.ajax({
      type: 'post',
      url: '/api/todos',
      data: JSON.stringify(todo),
      contentType: 'application/json',
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
    if (apiTodo.month && apiTodo.year) {
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
    if (currentSectionKey.includes('date')) {
      title = title.replace(/completed/i, '');
      return this[currentSectionKey][title] || [];
    } else {
      return this[currentSectionKey];
    }
  }

  getCurrentSection(currentSectionKey, title) {
    let total;
    if (currentSectionKey.includes('date')) {
      title = title.replace(/completed/i, '');
      total = this[currentSectionKey][title] ? this[currentSectionKey][title].length : 0;
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

  addTodoFromForm() {
    let $form = $('#form_modal');
    let $userInputs = $form.find('select, input[type="text"], textarea');
    let todo = this.makeTodoObjectFromInputs($userInputs);
    this.api.add(todo);
  }

  makeTodoObjectFromInputs($userInputs) {
    let todo = {}
    $userInputs.each((_, input) => {
      if (input.value) {
        console.log(input.value);
        todo[input.id] = input.value;
      }
    });
    
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
    this.todoList.makeMainTemplateObject((mainTemplateObject) => {
      $('body').append(this.mainTemplate(mainTemplateObject));
      $(`[data-title="${currentSectionTitle}"]`).addClass('active');
      this.bindEvents();
    }, currentSectionTemplateKey, currentSectionTitle);
  }

  reloadPage() {
    let currentSectionTemplateKey = $('.active').attr('data-template-key');
    let currentSectionTitle = $('.active').attr('data-title');
    $('body').empty();
    this.loadPage(currentSectionTemplateKey, currentSectionTitle);
  }

  bindEvents() {
    $('label[for="new_item"').on('click', $.proxy(this.handleNewItemClick, this));
    $('#modal_layer').on('click', $.proxy(this.handleModalLayerClick, this));
    $('input[type="submit"').on('click', $.proxy(this.handleSaveClick, this));

    // 2nd argument limits event to elements that represent a todo subset
    $('#sidebar').on('click', '[data-title]', $.proxy(this.handleSidebarClick, this));
    $('#list-template-parent').on('click', 'td.list_item', $.proxy(this.handleTodoItemClick, this));
    $('#list-template-parent').on('click', 'td.delete', $.proxy(this.handleDeleteClick, this));
  }

  handleNewItemClick() {
    $('#form_modal').fadeIn();
    $('#modal_layer').fadeIn();
  }

  handleModalLayerClick() {
    this.resetAndHideModal();
  }

  resetAndHideModal() {
    $('#form_modal').fadeOut();
    $('#modal_layer').fadeOut();
    $('#form_modal form')[0].reset();
  }

  handleSaveClick(event) {
    event.preventDefault();
    this.todoList.addTodoFromForm();
    this.resetAndHideModal();
    this.reloadPage();
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

  handleDeleteClick(event) {
    let id = $(event.target).closest('tr').attr('data-id');
    this.todoList.api.delete(id, () => {
      this.reloadPage();
    });
  }
}

$(() => new App());