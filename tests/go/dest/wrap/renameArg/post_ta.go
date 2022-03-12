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
	result, err := mrQueryable.Exec("UPDATE `user` SET `url_name` = ?, `display_name` = ?, `sig` = ?, `age` = ?, `follower_c` = ? WHERE `id` = ?", urlName, displayName, sig, age, followerCount, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

func (mrTable *TableTypePost) B(mrQueryable mingru.Queryable, urlName string, displayName string, renamed *string, age int, followerCount *string, id uint64) error {
	return User.T(mrQueryable, urlName, displayName, renamed, age, followerCount, id)
}
