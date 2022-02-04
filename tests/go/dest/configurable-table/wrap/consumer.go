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
func (mrTable *TableTypePost) AddPost(queryable mingru.Queryable, tID uint64) (uint64, error) {
	return UserT.Insert(queryable, "post_t", tID)
}

// AddUser ...
func (mrTable *TableTypePost) AddUser(queryable mingru.Queryable, tID uint64) (uint64, error) {
	return UserT.Insert(queryable, "user_t", tID)
}
