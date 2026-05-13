import {
  Model,
  DataTypes,
  Sequelize,
  Optional,
} from 'sequelize';
import bcrypt from 'bcrypt';
import { UsuarioAttributes, Turno } from '../types/models';

type UsuarioCreationAttributes = Optional<UsuarioAttributes, 'id' | 'activo' | 'turno_default' | 'created_at' | 'updated_at'>;

class Usuario extends Model<UsuarioAttributes, UsuarioCreationAttributes> implements UsuarioAttributes {
  declare id: number;
  declare username: string;
  declare pin: string;
  declare turno_default: Turno;
  declare activo: boolean;
  declare created_at: Date;
  declare updated_at: Date;

  async validarPin(pinIngresado: string): Promise<boolean> {
    return bcrypt.compare(pinIngresado, this.pin);
  }

  static associate(models: Record<string, any>): void {
    Usuario.hasMany(models['Registro'], { foreignKey: 'usuario_id' });
  }
}

export function initUsuario(sequelize: Sequelize): typeof Usuario {
  Usuario.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      pin: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      turno_default: {
        type: DataTypes.ENUM('Mañana', 'Tarde', 'Noche', 'Noche Domingo'),
        allowNull: false,
        defaultValue: 'Mañana',
      },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      tableName: 'usuarios',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      hooks: {
        beforeCreate: async (usuario: Usuario) => {
          usuario.pin = await bcrypt.hash(usuario.pin, 12);
        },
        beforeUpdate: async (usuario: Usuario) => {
          if (usuario.changed('pin')) {
            usuario.pin = await bcrypt.hash(usuario.pin, 12);
          }
        },
      },
    }
  );

  return Usuario;
}

export default Usuario;
