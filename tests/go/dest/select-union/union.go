package da

import "github.com/mgenware/mingru-go-lib"

// TableTypeActivity ...
type TableTypeActivity struct {
}

// Activity ...
var Activity = &TableTypeActivity{}

// MingruSQLName returns the name of this table.
func (mrTable *TableTypeActivity) MingruSQLName() string {
	return "activity"
}

// ------------ Actions ------------

// ActivityTableTResult ...
type ActivityTableTResult struct {
	GenericName string
	GenericSig  *string
	ID          uint64
}

// T ...
func (mrTable *TableTypeActivity) T(mrQueryable mingru.Queryable, id uint64, postID uint64) ([]ActivityTableTResult, error) {
	rows, err := mrQueryable.Query("(SELECT `id`, `sig` AS `generic_sig`, `url_name` AS `generic_name` FROM `user` WHERE `id` = ?) UNION (SELECT `id`, `title` FROM `db_post` WHERE `id` = ?) UNION ALL (SELECT `user_id`, `value` FROM `like`) ORDER BY `id`", id, postID)
	if err != nil {
		return nil, err
	}
	var result []ActivityTableTResult
	defer rows.Close()
	for rows.Next() {
		var item ActivityTableTResult
		err = rows.Scan(&item.ID, &item.GenericSig, &item.GenericName)
		if err != nil {
			return nil, err
		}
		result = append(result, item)
	}
	err = rows.Err()
	if err != nil {
		return nil, err
	}
	return result, nil
}
