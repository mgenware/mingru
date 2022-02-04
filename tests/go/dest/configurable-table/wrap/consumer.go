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
func (mrTable *TableTypePost) AddPost(queryable mingru.Queryable, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	return UserUtil.Insert(queryable, "db_post", urlName, displayName, sig, age, followerCount)
}

// AddUser ...
func (mrTable *TableTypePost) AddUser(queryable mingru.Queryable, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	return UserUtil.Insert(queryable, "user", urlName, displayName, sig, age, followerCount)
}
