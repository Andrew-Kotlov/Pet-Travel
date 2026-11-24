module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define('Message', {senderId: {type: DataTypes.INTEGER, allowNull: false}, recipientId: {type: DataTypes.INTEGER, allowNull: false}, text: {type: DataTypes.TEXT, allowNull: false}});
  Message.associate = ({User}) => {
    Message.belongsTo(User, {as: 'sender', foreignKey: 'senderId'});
    Message.belongsTo(User, {as: 'recipient', foreignKey: 'recipientId'});
  };
  return Message;
};
