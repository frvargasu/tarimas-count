'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Tabla: usuarios
    await queryInterface.createTable('usuarios', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      pin: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      turno_default: {
        type: Sequelize.ENUM('Mañana', 'Tarde', 'Noche', 'Noche Domingo'),
        allowNull: false,
        defaultValue: 'Mañana'
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // 2. Tabla: registros
    await queryInterface.createTable('registros', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE'
      },
      fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      turno: {
        type: Sequelize.ENUM('Mañana', 'Tarde', 'Noche', 'Noche Domingo'),
        allowNull: false
      },
      actividad: {
        type: Sequelize.ENUM('carga', 'hauler'),
        allowNull: false
      },
      tarimas: {
        type: 'SMALLINT UNSIGNED',
        allowNull: false
      },
      hora: {
        type: Sequelize.DATE,
        allowNull: false
      },
      sincronizado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('registros', ['usuario_id', 'fecha'], {
      name: 'idx_registros_usuario_fecha'
    });

    await queryInterface.addIndex('registros', ['fecha', 'actividad'], {
      name: 'idx_registros_fecha_actividad'
    });

    // CHECK constraint: tarimas > 0
    await queryInterface.sequelize.query(
      'ALTER TABLE registros ADD CONSTRAINT chk_tarimas CHECK (tarimas > 0);'
    );

    // 3. Tabla: sync_queue
    await queryInterface.createTable('sync_queue', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'usuarios', key: 'id' },
        onDelete: 'CASCADE'
      },
      payload: {
        type: Sequelize.JSON,
        allowNull: false
      },
      intentos: {
        type: Sequelize.TINYINT,
        allowNull: false,
        defaultValue: 0
      },
      sincronizado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      synced_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      }
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback en orden inverso (respetar FK constraints)
    await queryInterface.dropTable('sync_queue');

    await queryInterface.removeIndex('registros', 'idx_registros_fecha_actividad');
    await queryInterface.removeIndex('registros', 'idx_registros_usuario_fecha');
    await queryInterface.dropTable('registros');

    await queryInterface.dropTable('usuarios');

    // Limpiar ENUMs residuales de MySQL
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS `enum_registros_turno`;").catch(() => {});
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS `enum_registros_actividad`;").catch(() => {});
    await queryInterface.sequelize.query("DROP TYPE IF EXISTS `enum_usuarios_turno_default`;").catch(() => {});
  }
};
