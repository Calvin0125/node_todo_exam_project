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
    data: 3,
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
        todo[input.id] = input.value;
      }
    });
    
    return todo;
  }

  makeMainTemplateObject() {

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

  loadPage() {
    let mainTemplateObject = this.todoList.makeMainTemplateObject();
    $('body').append(this.mainTemplate(templateObject));
    this.bindEvents();
  }

  reloadPage() {
    $('body').empty();
    this.loadPage();
  }

  bindEvents() {
    $('label[for="new_item"').on('click', $.proxy(this.handleNewItemClick, this));
    $('#modal_layer').on('click', $.proxy(this.handleModalLayerClick, this));
    $('input[type="submit"').on('click', $.proxy(this.handleSaveClick, this));
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
}

$(() => new App());