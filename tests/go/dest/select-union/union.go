package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeActivity ...
type TableTypeActivity struct {
}

// Activity ...
var Activity = &TableTypeActivity{}

// ------------ Actions ------------

// ActivityTableTResult ...
type ActivityTableTResult struct {
	ID          uint64
	GenericSig  *string
	GenericName string
}

// T ...
func (da *TableTypeActivity) T(queryable mingru.Queryable, id uint64, postID uint64) (*ActivityTableTResult, error) {
	result := &ActivityTableTResult{}
	err := queryable.QueryRow("SELECT `id`, `sig` AS `generic_sig`, `url_name` AS `generic_name` FROM `user` WHERE `id` = ? UNION SELECT `id`, `title` FROM `db_post` WHERE `id` = ? UNION ALL SELECT `user_id`, `value` FROM `like` UNION SELECT `user_id`, `value` FROM `like`", id, postID).Scan(&result.ID, &result.GenericSig, &result.GenericName)
	if err != nil {
		return nil, err
	}
	return result, nil
}
