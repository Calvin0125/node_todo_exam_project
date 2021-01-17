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

let mainTemplate = Handlebars.compile($('#main_template').html());
$('[data-type="partial"]').each((_, partial) => {
  Handlebars.registerPartial(`${partial.id}`, `${$(partial).html()}`);
});
$('body').append(mainTemplate(templateObject));