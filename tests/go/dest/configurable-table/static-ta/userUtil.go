package da

import "github.com/mgenware/mingru-go-lib"

type UserUtilAGType struct {
}

var UserUtil = &UserUtilAGType{}

// ------------ Actions ------------

func (mrTable *UserUtilAGType) T(mrQueryable mingru.Queryable, cname mingru.Table, id uint64, urlName string, displayName string, sig *string, age int, followerCount *string) error {
	result, err := mrQueryable.Exec("UPDATE "+string(cname)+" SET `url_name` = ?, `display_name` = ?, `sig` = ?, `age` = ?, `follower_c` = ? WHERE `id` = ?", urlName, displayName, sig, age, followerCount, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}
