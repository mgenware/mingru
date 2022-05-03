package da

import "github.com/mgenware/mingru-go-lib"

type ActivityAGType struct {
}

var Activity = &ActivityAGType{}

// ------------ Actions ------------

type ActivityAGPrivateTResult struct {
	GenericName string
	GenericSig  *string
	ID          uint64
}

func (mrTable *ActivityAGType) PrivateT(mrQueryable mingru.Queryable, id uint64) (ActivityAGPrivateTResult, error) {
	var result ActivityAGPrivateTResult
	err := mrQueryable.QueryRow("SELECT `id`, `sig` AS `generic_sig`, `url_name` AS `generic_name` FROM `user` WHERE `id` = ?", id).Scan(&result.ID, &result.GenericSig, &result.GenericName)
	if err != nil {
		return result, err
	}
	return result, nil
}

type ActivityAGTResult struct {
	GenericName string
	GenericSig  *string
	ID          uint64
}

func (mrTable *ActivityAGType) T(mrQueryable mingru.Queryable, id uint64, postID uint64) ([]ActivityAGTResult, error) {
	rows, err := mrQueryable.Query("(SELECT `id`, `sig` AS `generic_sig`, `url_name` AS `generic_name` FROM `user` WHERE `id` = ?) UNION (SELECT `id`, `title` FROM `db_post` WHERE `id` = ?) UNION ALL (SELECT `user_id`, `value` FROM `like`) ORDER BY `generic_sig`", id, postID)
	if err != nil {
		return nil, err
	}
	var result []ActivityAGTResult
	defer rows.Close()
	for rows.Next() {
		var item ActivityAGTResult
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
