import * as dd from 'dd-models';
import user from './models/user';
import post from './models/post';

const userTA = dd.actions(user);
// Select a single row by ID
userTA.select('UserProfile', user.display_name, user.sig).byID();
// Select all rows
userTA.selectAll('AllUserProfiles', user.display_name, user.sig);
// Select a single field of a row
userTA.selectField('UserName', user.display_name).byID();
// Update a row
userTA
  .update('UserProfile')
  .setInputs(user.display_name, user.sig)
  .byID();
// Delete a row by ID
userTA.deleteOne('ByID').byID();

const postTA = dd.actions(post);
postTA.select('Post', post.id, post.content, post.user_id.join(user).url_name);
postTA
  .update('Content')
  .setInputs(post.content)
  .byID();
postTA.deleteOne('ByID').byID();

export default [userTA, postTA];
