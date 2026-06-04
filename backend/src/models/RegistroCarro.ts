import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { RegistroCarroAttributes } from '../types/models';

type RegistroCarroCreationAttributes = Optional<
  RegistroCarroAttributes,
  'id' | 'comentario' | 'created_at' | 'updated_at'
>;

class RegistroCarro
  extends Model<RegistroCarroAttributes, RegistroCarroCreationAttributes>
  implements RegistroCarroAttributes
{
  declare id: number;
  declare fase: number;
  declare anden: number;
  declare capacidad_carro: number;
  declare num_locales: number;
  declare comentario: string | null;
  declare created_at: Date;
  declare updated_at: Date;
}

export function initRegistroCarro(sequelize: Sequelize): typeof RegistroCarro {
  RegistroCarro.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      fase: { type: DataTypes.TINYINT, allowNull: false },
      anden: { type: DataTypes.INTEGER, allowNull: false },
      capacidad_carro: { type: DataTypes.SMALLINT, allowNull: false },
      num_locales: { type: DataTypes.TINYINT, allowNull: false },
      comentario: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      tableName: 'registro_carro',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );
  return RegistroCarro;
}

export default RegistroCarro;
