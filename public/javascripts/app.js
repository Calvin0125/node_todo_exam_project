let templateObject = {
  todos: [
    {
      id: 1,
      title: 'Buy Groceries',
      due_date: '02/21',
      completed: true,
    },
    {
      id: 2,
      title: 'Go to Gym',
      due_date: '03/21',
      completed: false,
    },
    {
      id: 3,
      title: 'Walk the Dog',
      due_date: '03/21',
      completed: false,
    }
  ],

  todos_by_date: {
    '02/21': [1],
    '03/21': [2, 3],
  },

  done: [1],
  done_todos_by_date: {
    '02/21': [1]
  },
  selected: [
    {
      id: 1,
      title: 'Buy Groceries',
      due_date: '02/21',
      completed: true,
    },
    {
      id: 2,
      title: 'Go to Gym',
      due_date: '03/21',
      completed: false,
    },
    {
      id: 3,
      title: 'Walk the Dog',
      due_date: '03/21',
      completed: false,
    }
  ],
  current_section: {
    title: 'All Todos',
    total: 3,
  }
};

class API {
  add(todo) {
    $.ajax({
      type: 'post',
      url: '/api/todos',
      data: JSON.stringify(todo),
      contentType: 'application/json'
    });
  }

  getAllTodos(callback) {
    $.get('/api/todos', callback, 'json');
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

    return uniqueDates;
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
      doneTodosByDate[date] = this.done_todos_by_date.filter(todo => {
        return todo.due_date === date;
      });
    });

    return doneTodosByDate;
  }

  getSelectedTodos(currentSectionKey, title) {
    if (currentSectionKey.includes('date')) {
      return this[currentSectionKey][title];
    } else {
      return this[currentSectionKey];
    }
  }

  getCurrentSection(currentSectionKey, title) {
    let total;
    if (currentSectionKey.includes('date')) {
      total = this[currentSectionKey][title].length;
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
      callback(mainTemplateData);
    });
  }
}

class App {
  constructor() {
    this.todoList = new TodoList();
    this.mainTemplate = Handlebars.compile($('#main_template').html());
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
    $(event.target).closest('[data-title]').addClass('active');
    this.reloadPage();
  }
}

$(() => new App());