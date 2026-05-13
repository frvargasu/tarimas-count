import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { RegistroAttributes, Turno, Actividad } from '../types/models';

type RegistroCreationAttributes = Optional<RegistroAttributes, 'id' | 'sincronizado' | 'created_at'>;

class Registro extends Model<RegistroAttributes, RegistroCreationAttributes> implements RegistroAttributes {
  declare id: number;
  declare usuario_id: number;
  declare fecha: string;
  declare turno: Turno;
  declare actividad: Actividad;
  declare tarimas: number;
  declare hora: Date;
  declare sincronizado: boolean;
  declare created_at: Date;

  static associate(models: Record<string, any>): void {
    Registro.belongsTo(models['Usuario'], { foreignKey: 'usuario_id' });
  }
}

export function initRegistro(sequelize: Sequelize): typeof Registro {
  Registro.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      usuario_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id',
        },
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      turno: {
        type: DataTypes.ENUM('Mañana', 'Tarde', 'Noche', 'Noche Domingo'),
        allowNull: false,
      },
      actividad: {
        type: DataTypes.ENUM('carga', 'hauler'),
        allowNull: false,
      },
      tarimas: {
        type: DataTypes.SMALLINT.UNSIGNED,
        allowNull: false,
        validate: {
          min: {
            args: [1],
            msg: 'tarimas debe ser mayor a 0',
          },
        },
      },
      hora: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      sincronizado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'registros',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return Registro;
}

export default Registro;
