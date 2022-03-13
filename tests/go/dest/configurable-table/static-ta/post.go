package da

import "github.com/mgenware/mingru-go-lib"

type TableTypePost struct {
}

var Post = &TableTypePost{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypePost) MingruSQLName() string {
	return "db_post"
}

// ------------ Actions ------------

func (mrTable *TableTypePost) T(mrQueryable mingru.Queryable, urlName string, displayName string, sig *string, age int, followerCount *string, id uint64) error {
	return UserUtil.T(mrQueryable, Post, urlName, displayName, sig, age, followerCount, id)
}
