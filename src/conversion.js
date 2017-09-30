import kdbxweb from 'kdbxweb';
import {parse} from 'papaparse';

const unusedArgument = 'UNUSED_ARGUMENT';

const passwordField = 'Password';

const lastPassToKeePassFields = {
  extra: 'Notes',
  name: 'Title',
  password: passwordField,
  url: 'URL',
  username: 'UserName',
};

const protectedFields = new Set([passwordField]);

const findOrCreateGroup = (db, parentGroup, groupName) => {
  const exitingGroup = parentGroup.groups.find(
    group => group.name === groupName
  );
  if (exitingGroup) {
    return exitingGroup;
  }

  return db.createGroup(parentGroup, groupName);
};

export default csv => {
  const {data: rows} = parse(csv, {header: true});
  const credentials = new kdbxweb.Credentials(
    kdbxweb.ProtectedValue.fromString(unusedArgument)
  );
  const db = kdbxweb.Kdbx.create(credentials, unusedArgument);
  const defaultGroup = db.getDefaultGroup();

  rows.forEach(row => {
    if (!row.name) {
      return;
    }

    const group = findOrCreateGroup(db, defaultGroup, row.grouping);
    const entry = db.createEntry(group);
    Object.keys(lastPassToKeePassFields).forEach(lastPassField => {
      const value = row[lastPassField];
      if (value) {
        const keePassField = lastPassToKeePassFields[lastPassField];
        entry.fields[keePassField] = protectedFields.has(keePassField)
          ? kdbxweb.ProtectedValue.fromString(value)
          : value;
      }
    });
  });

  return db.saveXml();
};
