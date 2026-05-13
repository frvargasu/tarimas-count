import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { SyncQueueAttributes, RegistroPayload } from '../types/models';

type SyncQueueCreationAttributes = Optional<
  SyncQueueAttributes,
  'id' | 'intentos' | 'sincronizado' | 'created_at' | 'synced_at'
>;

class SyncQueue
  extends Model<SyncQueueAttributes, SyncQueueCreationAttributes>
  implements SyncQueueAttributes
{
  declare id: number;
  declare usuario_id: number;
  declare payload: RegistroPayload;
  declare intentos: number;
  declare sincronizado: boolean;
  declare created_at: Date;
  declare synced_at: Date | null;

  static associate(models: Record<string, any>): void {
    SyncQueue.belongsTo(models['Usuario'], { foreignKey: 'usuario_id' });
  }
}

export function initSyncQueue(sequelize: Sequelize): typeof SyncQueue {
  SyncQueue.init(
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
      payload: {
        type: DataTypes.JSON,
        allowNull: false,
      },
      intentos: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 0,
      },
      sincronizado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      synced_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      tableName: 'sync_queue',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
    }
  );

  return SyncQueue;
}

export default SyncQueue;
