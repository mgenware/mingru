import * as dd from 'dd-models';
import user from './models/user';
import post from './models/post';

const userTA = dd.actions(user);
// Get profile info (display_name, sig)
userTA.select('Profile', user.display_name, user.sig);
// Update profile info
userTA.update('Profile').set(user.sig, user.sig.isEqualToInput());
// Delete by ID
userTA.delete('ByID').where(user.id.isEqualToInput());

const postTA = dd.actions(post);
// Get post info
postTA.select(
  'PostInfo',
  post.id,
  post.content,
  post.user_id.join(user).url_name,
);
// Update content
postTA.update('Content').set(post.content, post.content.isEqualToInput());
// Delete by ID
postTA.delete('ByID').where(post.id.isEqualToInput());

export default [userTA, postTA];
