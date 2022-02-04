package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeUserUtil ...
type TableTypeUserUtil struct {
}

// UserUtil ...
var UserUtil = &TableTypeUserUtil{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeUserUtil) MingruSQLName() string {
	return "user_util"
}

// ------------ Actions ------------

// Insert ...
func (mrTable *TableTypeUserUtil) Insert(queryable mingru.Queryable, mrFromTable mingru.Table, urlName string, displayName string, sig *string, age int, followerCount *string) (uint64, error) {
	result, err := queryable.Exec("INSERT INTO "+mrFromTable.MingruSQLName()+" (`url_name`, `display_name`, `sig`, `age`, `follower_c`) VALUES (?, ?, ?, ?, ?)", urlName, displayName, sig, age, followerCount)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
