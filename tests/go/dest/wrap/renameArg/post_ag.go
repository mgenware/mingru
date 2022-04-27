package da

import "github.com/mgenware/mingru-go-lib"

type PostAGType struct {
}

var Post = &PostAGType{}

// ------------ Actions ------------

func (mrTable *PostAGType) T(mrQueryable mingru.Queryable, id uint64, urlName string, displayName string, sig *string, age int, followerCount *string) error {
	result, err := mrQueryable.Exec("UPDATE `user` SET `url_name` = ?, `display_name` = ?, `sig` = ?, `age` = ?, `follower_c` = ? WHERE `id` = ?", urlName, displayName, sig, age, followerCount, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

func (mrTable *PostAGType) B(mrQueryable mingru.Queryable, id uint64, urlName string, displayName string, renamed *string, age int, followerCount *string) error {
	return User.T(mrQueryable, id, urlName, displayName, renamed, age, followerCount)
}
