'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('usuarios', 'turno_default', {
      type: Sequelize.ENUM('Mañana', 'Tarde', 'Noche', 'Noche Domingo'),
      allowNull: false,
      defaultValue: 'Mañana',
    });

    await queryInterface.changeColumn('registros', 'turno', {
      type: Sequelize.ENUM('Mañana', 'Tarde', 'Noche', 'Noche Domingo'),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('usuarios', 'turno_default', {
      type: Sequelize.ENUM('AM-PM', 'NOCHE', 'DOMINGO'),
      allowNull: false,
      defaultValue: 'AM-PM',
    });

    await queryInterface.changeColumn('registros', 'turno', {
      type: Sequelize.ENUM('AM-PM', 'NOCHE', 'DOMINGO'),
      allowNull: false,
    });
  },
};
