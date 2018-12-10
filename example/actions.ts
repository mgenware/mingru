import * as dd from 'dd-models';
import user from './models/user';
import post from './models/post';

const userTA = dd.actions(user);
// Select a single row by ID
userTA
  .select('Profile', user.display_name, user.sig)
  .where(user.id.toInputSQL());
// Update a row
userTA
  .update('Profile')
  .setInputs(user.display_name, user.sig)
  .where(user.id.toInputSQL());
// Delete a row by ID
userTA.deleteOne('ByID').byID();

const postTA = dd.actions(post);
postTA.select(
  'PostInfo',
  post.id,
  post.content,
  post.user_id.join(user).url_name,
);
postTA
  .update('Content')
  .setInputs(post.content)
  .where(post.id.toInputSQL());
postTA.deleteOne('ByID').byID();

export default [userTA, postTA];
