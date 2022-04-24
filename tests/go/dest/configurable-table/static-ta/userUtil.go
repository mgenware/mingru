package da

import "github.com/mgenware/mingru-go-lib"

type TableTypeUserUtil struct {
}

var UserUtil = &TableTypeUserUtil{}

// ------------ Actions ------------

func (mrTable *TableTypeUserUtil) T(mrQueryable mingru.Queryable, cname string, id uint64, urlName string, displayName string, sig *string, age int, followerCount *string) error {
	result, err := mrQueryable.Exec("UPDATE "+cname+" SET `url_name` = ?, `display_name` = ?, `sig` = ?, `age` = ?, `follower_c` = ? WHERE `id` = ?", urlName, displayName, sig, age, followerCount, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
