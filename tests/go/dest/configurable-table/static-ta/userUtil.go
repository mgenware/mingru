package da

import "github.com/mgenware/mingru-go-lib"

type TableTypeUserUtil struct {
}

var UserUtil = &TableTypeUserUtil{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeUserUtil) MingruSQLName() string {
	return "user_util"
}

// ------------ Actions ------------

func (mrTable *TableTypeUserUtil) T(mrQueryable mingru.Queryable, cname mingru.Table, id uint64, urlName string, displayName string, sig *string, age int, followerCount *string) error {
	result, err := mrQueryable.Exec("UPDATE "+cname.MingruSQLName()+" SET `url_name` = ?, `display_name` = ?, `sig` = ?, `age` = ?, `follower_c` = ? WHERE `id` = ?", urlName, displayName, sig, age, followerCount, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
