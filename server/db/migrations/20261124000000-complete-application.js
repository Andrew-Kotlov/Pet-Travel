module.exports = {
  async up(q, S, transaction) {
    // Fail safely on ambiguous legacy data; never delete or silently merge existing accounts.
    await q.sequelize.query('CREATE UNIQUE INDEX users_email_lower_unique ON "Users" (lower(email))', {transaction});
    await q.addIndex('ParentProfiles', ['UserId'], {unique: true});
    await q.addIndex('SitterProfiles', ['UserId'], {unique: true});
    await q.changeColumn('SitterProfiles', 'UserId', {type: S.INTEGER, allowNull: false, references: {model: 'Users', key: 'id'}});
    for (const col of ['dateSince1', 'dateUntil1']) await q.changeColumn('ParentProfiles', col, {type: S.DATE, allowNull: true});
    await q.createTable('Messages', {
      id: {type: S.INTEGER, primaryKey: true, autoIncrement: true},
      senderId: {type: S.INTEGER, allowNull: false, references: {model: 'Users', key: 'id'}},
      recipientId: {type: S.INTEGER, allowNull: false, references: {model: 'Users', key: 'id'}},
      text: {type: S.TEXT, allowNull: false},
      createdAt: {type: S.DATE, allowNull: false}, updatedAt: {type: S.DATE, allowNull: false}
    });
    await q.addIndex('Messages', ['senderId', 'recipientId', 'id']);
    await q.addIndex('Messages', ['recipientId', 'senderId', 'id']);
    await q.sequelize.query('CREATE TABLE session (sid varchar PRIMARY KEY, sess json NOT NULL, expire timestamp(6) NOT NULL); CREATE INDEX session_expire_idx ON session(expire)', {transaction});
    await q.sequelize.query('ALTER TABLE "Users" ADD CONSTRAINT user_role CHECK (role IN (\'parent\', \'sitter\')); ALTER TABLE "Pets" ADD CONSTRAINT pet_age CHECK ("petAge" BETWEEN 0 AND 100); ALTER TABLE "Messages" ADD CONSTRAINT message_size CHECK (char_length(text) BETWEEN 1 AND 2000)', {transaction});
  },
  async down() { throw new Error('Use a reviewed forward migration; this migration preserves application data.'); }
};
