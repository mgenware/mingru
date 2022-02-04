package da

import "github.com/mgenware/mingru-go-lib"

// TableTypePost ...
type TableTypePost struct {
}

// Post ...
var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

// AddPost ...
func (mrTable *TableTypePost) AddPost(mrQueryable mingru.Queryable, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	return UserUtil.Insert(mrQueryable, "db_post", urlName, displayName, sig, age, followerCount)
}

// AddUser ...
func (mrTable *TableTypePost) AddUser(mrQueryable mingru.Queryable, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	return UserUtil.Insert(mrQueryable, "user", urlName, displayName, sig, age, followerCount)
}
