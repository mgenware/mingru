package da

import "github.com/mgenware/mingru-go-lib"

type TableTypeUser struct {
}

var User = &TableTypeUser{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeUser) MingruSQLName() string {
	return "user"
}

// ------------ Actions ------------

func (mrTable *TableTypeUser) T(mrQueryable mingru.Queryable, urlName string, displayName string, sig *string, age int, followerCount *string, id uint64) error {
	result, err := mrQueryable.Exec("UPDATE `user` SET `url_name` = ?, `display_name` = ?, `sig` = ?, `age` = ?, `follower_c` = ? WHERE `id` = ?", urlName, displayName, sig, age, followerCount, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
