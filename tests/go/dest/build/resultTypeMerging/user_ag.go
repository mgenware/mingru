package da

import "github.com/mgenware/mingru-go-lib"

type UserAGType struct {
}

var User = &UserAGType{}

// ------------ Actions ------------

func (mrTable *UserAGType) T1(mrQueryable mingru.Queryable, id uint64) (Res, error) {
	var result Res
	err := mrQueryable.QueryRow("SELECT `id`, `age` FROM `user` WHERE `id` = ?", id).Scan(&result.ID, &result.Age)
	if err != nil {
		return result, err
	}
	return result, nil
}

func (mrTable *UserAGType) T2(mrQueryable mingru.Queryable, id uint64) (Res, error) {
	var result Res
	err := mrQueryable.QueryRow("SELECT `display_name`, `age`, `follower_c` FROM `user` WHERE `id` = ?", id).Scan(&result.DisplayName, &result.Age, &result.FollowerCount)
	if err != nil {
		return result, err
	}
	return result, nil
}
