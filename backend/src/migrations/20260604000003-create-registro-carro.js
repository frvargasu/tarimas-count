'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('registro_carro', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      fase: { type: Sequelize.TINYINT, allowNull: false },
      anden: { type: Sequelize.INTEGER, allowNull: false },
      capacidad_carro: { type: Sequelize.SMALLINT, allowNull: false },
      num_locales: { type: Sequelize.TINYINT, allowNull: false },
      comentario: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('registro_carro', ['created_at'], { name: 'idx_registro_carro_created_at' });
  },
  async down(queryInterface) {
    await queryInterface.removeIndex('registro_carro', 'idx_registro_carro_created_at');
    await queryInterface.dropTable('registro_carro');
  },
};
