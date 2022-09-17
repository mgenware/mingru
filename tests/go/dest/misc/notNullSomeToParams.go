package da

import "github.com/mgenware/mingru-go-lib"

type TAGType struct {
}

var T = &TAGType{}

// ------------ Actions ------------

func (mrTable *TAGType) Edit(mrQueryable mingru.Queryable, id uint64, userID uint64, name *string) error {
	result, err := mrQueryable.Exec("UPDATE `t` SET `user_id` = ?, `name` = ? WHERE `id` = ?", userID, name, id)
	return mingru.CheckOneRowAffectedWithError(result, err)
}

func (mrTable *TAGType) Insert(mrQueryable mingru.Queryable, userID uint64, name *string) (uint64, error) {
	result, err := mrQueryable.Exec("INSERT INTO `t` (`user_id`, `name`) VALUES (?, ?)", userID, name)
	return mingru.GetLastInsertIDUint64WithError(result, err)
}
